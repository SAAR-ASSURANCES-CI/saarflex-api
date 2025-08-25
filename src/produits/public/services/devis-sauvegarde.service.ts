import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../../entities/devis-simule.entity';
import { Produit } from '../../entities/produit.entity';
import { GrilleTarifaire } from '../../entities/grille-tarifaire.entity';
import { SauvegardeDevisDto, DevisSauvegardeDto } from '../../dto/simulation-devis.dto';

@Injectable()
export class DevisSauvegardeService {
  constructor(
    @InjectRepository(DevisSimule)
    private devisSimuleRepository: Repository<DevisSimule>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(GrilleTarifaire)
    private grilleTarifaireRepository: Repository<GrilleTarifaire>,
  ) {}

  async sauvegarderDevis(
    sauvegardeDto: SauvegardeDevisDto,
    utilisateurId: string
  ): Promise<DevisSauvegardeDto> {
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: sauvegardeDto.devis_id },
      relations: ['produit', 'grilleTarifaire']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    if (devis.utilisateur_id && devis.utilisateur_id !== utilisateurId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à sauvegarder ce devis');
    }

    if (devis.expires_at && devis.expires_at < new Date()) {
      throw new BadRequestException('Ce devis a expiré et ne peut plus être sauvegardé');
    }

    devis.statut = StatutDevis.SAUVEGARDE;
    devis.utilisateur_id = utilisateurId;
    
    if (sauvegardeDto.nom_personnalise) {
      devis.nom_personnalise = sauvegardeDto.nom_personnalise;
    }
    if (sauvegardeDto.notes) {
      devis.notes = sauvegardeDto.notes;
    }

    devis.expires_at = null;

    const devisSauvegarde = await this.devisSimuleRepository.save(devis);

    return this.formatDevisSauvegarde(devisSauvegarde);
  }

  async recupererDevisSauvegardes(
    utilisateurId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    devis: DevisSauvegardeDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const [devis, total] = await this.devisSimuleRepository.findAndCount({
      where: {
        utilisateur_id: utilisateurId,
        statut: StatutDevis.SAUVEGARDE
      },
      relations: ['produit', 'grilleTarifaire'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total_pages = Math.ceil(total / limit);

    return {
      devis: devis.map(devis => this.formatDevisSauvegarde(devis)),
      total,
      page,
      limit,
      total_pages
    };
  }

  async recupererDevisParId(
    devisId: string,
    utilisateurId: string
  ): Promise<DevisSauvegardeDto> {
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId },
      relations: ['produit', 'grilleTarifaire']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    if (devis.utilisateur_id !== utilisateurId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à voir ce devis');
    }

    return this.formatDevisSauvegarde(devis);
  }

  async supprimerDevis(
    devisId: string,
    utilisateurId: string
  ): Promise<void> {
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId, utilisateur_id: utilisateurId }
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé ou vous n\'êtes pas autorisé à le supprimer');
    }

    await this.devisSimuleRepository.remove(devis);
  }

  async mettreAJourDevis(
    devisId: string,
    utilisateurId: string,
    updates: Partial<SauvegardeDevisDto>
  ): Promise<DevisSauvegardeDto> {
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId, utilisateur_id: utilisateurId }
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé ou vous n\'êtes pas autorisé à le modifier');
    }

    if (updates.nom_personnalise !== undefined) {
      devis.nom_personnalise = updates.nom_personnalise;
    }
    if (updates.notes !== undefined) {
      devis.notes = updates.notes;
    }

    const devisMisAJour = await this.devisSimuleRepository.save(devis);
    
    const devisComplet = await this.devisSimuleRepository.findOne({
      where: { id: devisId },
      relations: ['produit', 'grilleTarifaire']
    });

    if (!devisComplet) {
      throw new NotFoundException('Devis non trouvé après mise à jour');
    }

    return this.formatDevisSauvegarde(devisComplet);
  }

  async rechercherDevis(
    utilisateurId: string,
    criteres: {
      nom_produit?: string;
      type_produit?: string;
      date_debut?: Date;
      date_fin?: Date;
      prime_min?: number;
      prime_max?: number;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{
    devis: DevisSauvegardeDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const queryBuilder = this.devisSimuleRepository
      .createQueryBuilder('devis')
      .leftJoinAndSelect('devis.produit', 'produit')
      .leftJoinAndSelect('devis.grilleTarifaire', 'grilleTarifaire')
      .where('devis.utilisateur_id = :utilisateurId', { utilisateurId })
      .andWhere('devis.statut = :statut', { statut: StatutDevis.SAUVEGARDE });

    if (criteres.nom_produit) {
      queryBuilder.andWhere('produit.nom ILIKE :nom_produit', { 
        nom_produit: `%${criteres.nom_produit}%` 
      });
    }

    if (criteres.type_produit) {
      queryBuilder.andWhere('produit.type = :type_produit', { 
        type_produit: criteres.type_produit 
      });
    }

    if (criteres.date_debut) {
      queryBuilder.andWhere('devis.created_at >= :date_debut', { 
        date_debut: criteres.date_debut 
      });
    }

    if (criteres.date_fin) {
      queryBuilder.andWhere('devis.created_at <= :date_fin', { 
        date_fin: criteres.date_fin 
      });
    }

    if (criteres.prime_min !== undefined) {
      queryBuilder.andWhere('devis.prime_calculee >= :prime_min', { 
        prime_min: criteres.prime_min 
      });
    }

    if (criteres.prime_max !== undefined) {
      queryBuilder.andWhere('devis.prime_calculee <= :prime_max', { 
        prime_max: criteres.prime_max 
      });
    }

    const total = await queryBuilder.getCount();

    const devis = await queryBuilder
      .orderBy('devis.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const total_pages = Math.ceil(total / limit);

    return {
      devis: devis.map(devis => this.formatDevisSauvegarde(devis)),
      total,
      page,
      limit,
      total_pages
    };
  }

  private formatDevisSauvegarde(devis: DevisSimule): DevisSauvegardeDto {
    return {
      id: devis.id,
      nom_produit: devis.produit?.nom || 'Produit inconnu',
      type_produit: devis.produit?.type || 'Type inconnu',
      prime_calculee: devis.prime_calculee,
      franchise_calculee: devis.franchise_calculee,
      plafond_calcule: devis.plafond_calcule,
      criteres_utilisateur: devis.criteres_utilisateur,
      statut: devis.statut,
      created_at: devis.created_at,
      nom_personnalise: devis.nom_personnalise,
      notes: devis.notes
    };
  }

  async nettoyerDevisExpires(): Promise<void> {
    const maintenant = new Date();
    
    await this.devisSimuleRepository
      .createQueryBuilder()
      .update(DevisSimule)
      .set({ statut: StatutDevis.EXPIRE })
      .where('expires_at < :maintenant', { maintenant })
      .andWhere('statut = :statut', { statut: StatutDevis.SIMULATION })
      .execute();
  }
}
