import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrat, StatutContrat } from '../../entities/contrat.entity';
import { User, UserType } from '../../../users/entities/user.entity';
import { Beneficiaire } from '../../entities/beneficiaire.entity';
import {
  ContratsListQueryDto,
  ContratAdminDto,
  ContratsListResponseDto,
  UpdateContratStatutDto,
  ContratsStatsDto
} from '../../dto/contrats-admin.dto';

@Injectable()
export class ContratsAdminService {
  constructor(
    @InjectRepository(Contrat)
    private readonly contratRepository: Repository<Contrat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Beneficiaire)
    private readonly beneficiaireRepository: Repository<Beneficiaire>,
  ) {}

  /**
   * Récupère la liste paginée des contrats avec filtres
   * Accessible aux admins et agents
   */
  async getAllContrats(query: ContratsListQueryDto, userType: UserType): Promise<ContratsListResponseDto> {
    console.log('[ContratsAdminService] getAllContrats - Query:', query);
    console.log('[ContratsAdminService] getAllContrats - UserType:', userType);

    const {
      statut,
      produit_id,
      utilisateur_id,
      date_debut,
      date_fin,
      prime_min,
      prime_max,
      search,
      page = 1,
      limit = 10
    } = query;

    const qb = this.contratRepository
      .createQueryBuilder('contrat')
      .leftJoinAndSelect('contrat.produit', 'produit')
      .leftJoinAndSelect('contrat.grilleTarifaire', 'grilleTarifaire')
      .leftJoinAndSelect('contrat.utilisateur', 'utilisateur')
      .leftJoinAndSelect('contrat.devisSimule', 'devis');

    if (statut) {
      qb.andWhere('contrat.statut = :statut', { statut });
    }
    if (produit_id) {
      qb.andWhere('contrat.produit_id = :produit_id', { produit_id });
    }
    if (utilisateur_id) {
      qb.andWhere('contrat.utilisateur_id = :utilisateur_id', { utilisateur_id });
    }
    if (date_debut) {
      qb.andWhere('contrat.date_debut_couverture >= :date_debut', { date_debut });
    }
    if (date_fin) {
      qb.andWhere('contrat.date_fin_couverture <= :date_fin', { date_fin });
    }
    if (prime_min !== undefined) {
      qb.andWhere('contrat.prime_mensuelle >= :prime_min', { prime_min });
    }
    if (prime_max !== undefined) {
      qb.andWhere('contrat.prime_mensuelle <= :prime_max', { prime_max });
    }
    if (search && search.trim()) {
      qb.andWhere(
        '(contrat.numero_contrat LIKE :search OR produit.nom LIKE :search OR utilisateur.nom LIKE :search OR utilisateur.email LIKE :search)',
        { search: `%${search.trim()}%` }
      );
    }

    const total = await qb.getCount();

    const skip = (page - 1) * limit;
    const contrats = await qb
      .orderBy('contrat.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const contratsWithCounts = await Promise.all(
      contrats.map(async (c) => {
        const count = await this.beneficiaireRepository.count({ where: { contrat: { id: c.id } as any } });
        return { ...c, nombre_beneficiaires: count } as Contrat & { nombre_beneficiaires: number };
      })
    );

    console.log('[ContratsAdminService] getAllContrats - Found:', contratsWithCounts.length, 'contrats');

    return {
      data: contratsWithCounts.map((c) => this.mapToDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Détails d'un contrat
   * Accessible aux admins et agents
   */
  async getContratById(id: string): Promise<ContratAdminDto> {
    console.log('[ContratsAdminService] getContratById - ID:', id);

    const contrat = await this.contratRepository.findOne({
      where: { id },
      relations: ['produit', 'grilleTarifaire', 'utilisateur', 'devisSimule']
    });

    if (!contrat) {
      throw new NotFoundException('Contrat non trouvé');
    }

    const [nombre_beneficiaires, beneficiaires] = await Promise.all([
      this.beneficiaireRepository.count({ where: { contrat: { id } as any } }),
      this.beneficiaireRepository.find({
        where: { contrat_id: id },
        order: { ordre: 'ASC' },
      }),
    ]);

    return this.mapToDto(
      { ...contrat, nombre_beneficiaires } as Contrat & { nombre_beneficiaires: number },
      beneficiaires,
    );
  }

  /**
   * Modifier le statut d'un contrat (admin uniquement)
   */
  async updateContratStatut(id: string, dto: UpdateContratStatutDto, userType: UserType): Promise<ContratAdminDto> {
    console.log('[ContratsAdminService] updateContratStatut - ID:', id, 'Statut:', dto.statut);
    console.log('[ContratsAdminService] updateContratStatut - UserType:', userType);

    if (userType !== UserType.ADMIN) {
      throw new ForbiddenException("Seuls les administrateurs peuvent modifier le statut d'un contrat");
    }

    const contrat = await this.contratRepository.findOne({
      where: { id },
      relations: ['produit', 'grilleTarifaire', 'utilisateur', 'devisSimule']
    });

    if (!contrat) {
      throw new NotFoundException('Contrat non trouvé');
    }

    contrat.statut = dto.statut as StatutContrat;
    const updated = await this.contratRepository.save(contrat);
    const [nombre_beneficiaires, beneficiaires] = await Promise.all([
      this.beneficiaireRepository.count({ where: { contrat: { id } as any } }),
      this.beneficiaireRepository.find({
        where: { contrat_id: id },
        order: { ordre: 'ASC' },
      }),
    ]);

    console.log('[ContratsAdminService] updateContratStatut - Success');

    return this.mapToDto(
      { ...updated, nombre_beneficiaires } as Contrat & { nombre_beneficiaires: number },
      beneficiaires,
    );
  }

  /**
   * Statistiques des contrats
   */
  async getContratsStats(): Promise<ContratsStatsDto> {
    console.log('[ContratsAdminService] getContratsStats');

    const total = await this.contratRepository.count();

    const parStatut: Record<string, number> = {};
    for (const statut of Object.values(StatutContrat)) {
      parStatut[statut] = await this.contratRepository.count({ where: { statut } });
    }

    const result = await this.contratRepository
      .createQueryBuilder('contrat')
      .select('SUM(contrat.prime_mensuelle)', 'total')
      .getRawOne();

    const primes_totales = result?.total ? Number(result.total) : 0;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const ce_mois = await this.contratRepository
      .createQueryBuilder('contrat')
      .where('contrat.created_at >= :debutMois', { debutMois })
      .getCount();

    console.log('[ContratsAdminService] getContratsStats - Total:', total);

    return { total, par_statut: parStatut, primes_totales, ce_mois };
  }

  private mapToDto(
    contrat: Contrat & { nombre_beneficiaires: number },
    beneficiaires: Beneficiaire[] = [],
  ): ContratAdminDto {
    return {
      id: contrat.id,
      numero_contrat: contrat.numero_contrat,
      devis: contrat.devisSimule
        ? {
            id: contrat.devisSimule.id,
            reference: contrat.devisSimule.reference,
            statut: contrat.devisSimule.statut,
            prime_calculee: Number(contrat.devisSimule.prime_calculee),
            created_at: contrat.devisSimule.created_at,
          }
        : undefined,
      produit: {
        id: contrat.produit?.id || '',
        nom: contrat.produit?.nom || 'Produit inconnu',
        type: contrat.produit?.type || '',
        description: contrat.produit?.description || undefined
      },
      grille_tarifaire: {
        id: contrat.grilleTarifaire?.id || '',
        nom: contrat.grilleTarifaire?.nom || 'Grille inconnue'
      },
      utilisateur: contrat.utilisateur ? {
        id: contrat.utilisateur.id,
        nom: contrat.utilisateur.nom,
        email: contrat.utilisateur.email,
        telephone: contrat.utilisateur.telephone || undefined
      } : undefined,
      criteres_utilisateur: contrat.criteres_utilisateur,
      prime_mensuelle: Number(contrat.prime_mensuelle),
      franchise: Number(contrat.franchise),
      plafond: contrat.plafond ? Number(contrat.plafond) : undefined,
      periodicite_paiement: contrat.periodicite_paiement,
      duree_couverture: contrat.duree_couverture,
      statut: contrat.statut,
      date_debut_couverture: contrat.date_debut_couverture,
      date_fin_couverture: contrat.date_fin_couverture,
      assure_est_souscripteur: contrat.assure_est_souscripteur,
      informations_assure: contrat.informations_assure || undefined,
      chemin_recto_assure: contrat.chemin_recto_assure || undefined,
      chemin_verso_assure: contrat.chemin_verso_assure || undefined,
      nombre_beneficiaires: contrat.nombre_beneficiaires || 0,
      created_at: contrat.created_at,
      updated_at: contrat.updated_at,
      beneficiaires: beneficiaires.map((beneficiaire) => ({
        nom_complet: beneficiaire.nom_complet,
        lien_souscripteur: beneficiaire.lien_souscripteur,
        ordre: beneficiaire.ordre,
      })),
    };
  }
}


