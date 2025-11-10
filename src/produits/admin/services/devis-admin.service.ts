import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../../entities/devis-simule.entity';
import { User, UserType } from '../../../users/entities/user.entity';
import { DocumentIdentite } from '../../entities/document-identite.entity';
import {
  DevisListQueryDto,
  DevisAdminDto,
  DevisListResponseDto,
  UpdateDevisStatutDto,
  DevisStatsDto
} from '../../dto/devis-admin.dto';

@Injectable()
export class DevisAdminService {
  constructor(
    @InjectRepository(DevisSimule)
    private readonly devisRepository: Repository<DevisSimule>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DocumentIdentite)
    private readonly documentRepository: Repository<DocumentIdentite>,
  ) {}

  /**
   * Récupère la liste paginée des devis avec filtres
   * Accessible aux admins et agents
   */
  async getAllDevis(query: DevisListQueryDto, userType: UserType): Promise<DevisListResponseDto> {
    console.log('[DevisAdminService] getAllDevis - Query:', query);
    console.log('[DevisAdminService] getAllDevis - UserType:', userType);

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

    const queryBuilder = this.devisRepository
      .createQueryBuilder('devis')
      .leftJoinAndSelect('devis.produit', 'produit')
      .leftJoinAndSelect('devis.grilleTarifaire', 'grilleTarifaire')
      .leftJoinAndSelect('devis.utilisateur', 'utilisateur')
      .leftJoin('devis.documents', 'documents');

    // Filtres
    if (statut) {
      queryBuilder.andWhere('devis.statut = :statut', { statut });
    }

    if (produit_id) {
      queryBuilder.andWhere('devis.produit_id = :produit_id', { produit_id });
    }

    if (utilisateur_id) {
      queryBuilder.andWhere('devis.utilisateur_id = :utilisateur_id', { utilisateur_id });
    }

    if (date_debut) {
      queryBuilder.andWhere('devis.created_at >= :date_debut', { date_debut });
    }

    if (date_fin) {
      queryBuilder.andWhere('devis.created_at <= :date_fin', { date_fin });
    }

    if (prime_min !== undefined) {
      queryBuilder.andWhere('devis.prime_calculee >= :prime_min', { prime_min });
    }

    if (prime_max !== undefined) {
      queryBuilder.andWhere('devis.prime_calculee <= :prime_max', { prime_max });
    }

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(produit.nom LIKE :search OR utilisateur.nom LIKE :search OR utilisateur.email LIKE :search)',
        { search: `%${search.trim()}%` }
      );
    }

    // Compte total
    const total = await queryBuilder.getCount();

    // Pagination
    const skip = (page - 1) * limit;
    const devis = await queryBuilder
      .orderBy('devis.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Charger les documents pour chaque devis
    const devisWithDocuments = await Promise.all(
      devis.map(async (devis) => {
        const documents = await this.documentRepository.find({
          where: { devis_simule_id: devis.id }
        });
        return { ...devis, documents };
      })
    );

    console.log('[DevisAdminService] getAllDevis - Found:', devisWithDocuments.length, 'devis');

    return {
      data: devisWithDocuments.map(d => this.mapToDto(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Récupère les détails complets d'un devis
   * Accessible aux admins et agents
   */
  async getDevisById(id: string): Promise<DevisAdminDto> {
    console.log('[DevisAdminService] getDevisById - ID:', id);

    const devis = await this.devisRepository.findOne({
      where: { id },
      relations: ['produit', 'grilleTarifaire', 'utilisateur']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    const documents = await this.documentRepository.find({
      where: { devis_simule_id: id }
    });

    return this.mapToDto({ ...devis, documents });
  }

  /**
   * Modifie le statut d'un devis
   * Accessible uniquement aux admins
   */
  async updateDevisStatut(id: string, dto: UpdateDevisStatutDto, userType: UserType): Promise<DevisAdminDto> {
    console.log('[DevisAdminService] updateDevisStatut - ID:', id, 'Statut:', dto.statut);
    console.log('[DevisAdminService] updateDevisStatut - UserType:', userType);

    if (userType !== UserType.ADMIN) {
      throw new ForbiddenException('Seuls les administrateurs peuvent modifier le statut d\'un devis');
    }

    const devis = await this.devisRepository.findOne({
      where: { id },
      relations: ['produit', 'grilleTarifaire', 'utilisateur']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    devis.statut = dto.statut;
    const updatedDevis = await this.devisRepository.save(devis);

    const documents = await this.documentRepository.find({
      where: { devis_simule_id: id }
    });

    console.log('[DevisAdminService] updateDevisStatut - Success');

    return this.mapToDto({ ...updatedDevis, documents });
  }

  /**
   * Supprime un devis
   * Accessible uniquement aux admins
   */
  async deleteDevis(id: string, userType: UserType): Promise<void> {
    console.log('[DevisAdminService] deleteDevis - ID:', id);
    console.log('[DevisAdminService] deleteDevis - UserType:', userType);

    if (userType !== UserType.ADMIN) {
      throw new ForbiddenException('Seuls les administrateurs peuvent supprimer un devis');
    }

    const devis = await this.devisRepository.findOne({
      where: { id }
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    await this.devisRepository.remove(devis);
    console.log('[DevisAdminService] deleteDevis - Success');
  }

  /**
   * Récupère les statistiques des devis
   * Accessible aux admins et agents
   */
  async getDevisStats(): Promise<DevisStatsDto> {
    console.log('[DevisAdminService] getDevisStats');

    const total = await this.devisRepository.count();

    const parStatut: Record<string, number> = {};
    for (const statut of Object.values(StatutDevis)) {
      parStatut[statut] = await this.devisRepository.count({
        where: { statut }
      });
    }

    const result = await this.devisRepository
      .createQueryBuilder('devis')
      .select('SUM(devis.prime_calculee)', 'total')
      .getRawOne();

    const prime_totale = result?.total ? Number(result.total) : 0;

    // Devis créés ce mois
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const ce_mois = await this.devisRepository
      .createQueryBuilder('devis')
      .where('devis.created_at >= :debutMois', { debutMois })
      .getCount();

    console.log('[DevisAdminService] getDevisStats - Total:', total);

    return {
      total,
      par_statut: parStatut,
      prime_totale,
      ce_mois
    };
  }

  /**
   * Transforme un DevisSimule en DevisAdminDto
   */
  private mapToDto(devis: DevisSimule & { documents?: DocumentIdentite[] }): DevisAdminDto {
    return {
      id: devis.id,
      reference: devis.reference,
      produit: {
        id: devis.produit?.id || '',
        nom: devis.produit?.nom || 'Produit inconnu',
        type: devis.produit?.type || '',
        description: devis.produit?.description || undefined
      },
      grille_tarifaire: {
        id: devis.grilleTarifaire?.id || '',
        nom: devis.grilleTarifaire?.nom || 'Grille inconnue'
      },
      utilisateur: devis.utilisateur ? {
        id: devis.utilisateur.id,
        nom: devis.utilisateur.nom,
        email: devis.utilisateur.email,
        telephone: devis.utilisateur.telephone || undefined
      } : undefined,
      criteres_utilisateur: devis.criteres_utilisateur,
      prime_calculee: Number(devis.prime_calculee),
      franchise_calculee: Number(devis.franchise_calculee),
      plafond_calcule: devis.plafond_calcule ? Number(devis.plafond_calcule) : undefined,
      statut: devis.statut,
      expires_at: devis.expires_at || undefined,
      nom_personnalise: devis.nom_personnalise || undefined,
      notes: devis.notes || undefined,
      informations_assure: devis.informations_assure || undefined,
      assure_est_souscripteur: devis.assure_est_souscripteur,
      nombre_documents: devis.documents?.length || 0,
      created_at: devis.created_at
    };
  }
}

