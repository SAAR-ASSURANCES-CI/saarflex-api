import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../../entities/devis-simule.entity';
import { Beneficiaire } from '../../entities/beneficiaire.entity';
import { DocumentIdentite } from '../../entities/document-identite.entity';
import {
  SauvegardeDevisDto,
  DevisSauvegardeDto,
  ModifierDevisSauvegardeDto,
  FiltresRechercheDevisDto,
  DevisSauvegardesResponseDto
} from '../../dto/devis-sauvegarde.dto';

@Injectable()
export class DevisSauvegardeService {
  constructor(
    @InjectRepository(DevisSimule)
    private devisSimuleRepository: Repository<DevisSimule>,
    @InjectRepository(Beneficiaire)
    private beneficiaireRepository: Repository<Beneficiaire>,
    @InjectRepository(DocumentIdentite)
    private documentRepository: Repository<DocumentIdentite>,
  ) { }

  /**
   * Sauvegarde un devis simulé dans l'espace utilisateur
   */
  async sauvegarderDevis(
    sauvegardeDto: SauvegardeDevisDto,
    utilisateurId: string
  ): Promise<DevisSauvegardeDto> {
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: sauvegardeDto.devis_id },
      relations: ['produit', 'grilleTarifaire', 'documents']
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
    devis.expires_at = null;

    if (sauvegardeDto.nom_personnalise) {
      devis.nom_personnalise = sauvegardeDto.nom_personnalise;
    }
    if (sauvegardeDto.notes) {
      devis.notes = sauvegardeDto.notes;
    }

    const devisSauvegarde = await this.devisSimuleRepository.save(devis);
    return this.formatDevisSauvegarde(devisSauvegarde);
  }

  /**
   * Récupère la liste paginée des devis d'un utilisateur
   */
  async recupererDevisUtilisateur(
    utilisateurId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    devis: DevisSauvegardeDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [devis, total] = await this.devisSimuleRepository.findAndCount({
      where: {
        utilisateur_id: utilisateurId,
        statut: StatutDevis.SAUVEGARDE
      },
      relations: ['produit', 'grilleTarifaire', 'documents'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      devis: devis.map(d => this.formatDevisSauvegarde(d)),
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Récupère un devis spécifique par ID
   */
  async recupererDevisParId(
    devisId: string,
    utilisateurId: string
  ): Promise<DevisSauvegardeDto> {
    const devis = await this.devisSimuleRepository.findOne({
      where: {
        id: devisId,
        utilisateur_id: utilisateurId,
        statut: StatutDevis.SAUVEGARDE
      },
      relations: ['produit', 'grilleTarifaire']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé ou vous n\'avez pas les droits pour le consulter');
    }

    return this.formatDevisSauvegarde(devis);
  }

  /**
   * Modifie un devis sauvegardé (nom et notes uniquement)
   */
  async modifierDevis(
    devisId: string,
    utilisateurId: string,
    updateData: ModifierDevisSauvegardeDto
  ): Promise<DevisSauvegardeDto> {
    const devis = await this.devisSimuleRepository.findOne({
      where: {
        id: devisId,
        utilisateur_id: utilisateurId,
        statut: StatutDevis.SAUVEGARDE
      },
      relations: ['produit', 'grilleTarifaire']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé ou vous n\'avez pas les droits pour le modifier');
    }

    if (updateData.nom_personnalise !== undefined) {
      devis.nom_personnalise = updateData.nom_personnalise;
    }
    if (updateData.notes !== undefined) {
      devis.notes = updateData.notes;
    }

    const devisModifie = await this.devisSimuleRepository.save(devis);
    return this.formatDevisSauvegarde(devisModifie);
  }

  /**
   * Supprime définitivement un devis sauvegardé
   */
  async supprimerDevis(
    devisId: string,
    utilisateurId: string
  ): Promise<void> {
    const devis = await this.devisSimuleRepository.findOne({
      where: {
        id: devisId,
        utilisateur_id: utilisateurId,
        statut: StatutDevis.SAUVEGARDE
      }
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé ou vous n\'avez pas les droits pour le supprimer');
    }

    await this.devisSimuleRepository.remove(devis);
  }

  /**
   * Recherche des devis avec filtres (optionnel)
   */
  async rechercherDevis(
    utilisateurId: string,
    filtres: FiltresRechercheDevisDto,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    devis: DevisSauvegardeDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.devisSimuleRepository
      .createQueryBuilder('devis')
      .leftJoinAndSelect('devis.produit', 'produit')
      .leftJoinAndSelect('devis.grilleTarifaire', 'grilleTarifaire')
      .leftJoinAndSelect('devis.documents', 'documents')
      .where('devis.utilisateur_id = :utilisateurId', { utilisateurId })
      .andWhere('devis.statut = :statut', { statut: StatutDevis.SAUVEGARDE });

    if (filtres.nom_produit) {
      queryBuilder.andWhere('produit.nom ILIKE :nom_produit', {
        nom_produit: `%${filtres.nom_produit}%`
      });
    }

    if (filtres.type_produit) {
      queryBuilder.andWhere('produit.type = :type_produit', {
        type_produit: filtres.type_produit
      });
    }

    if (filtres.date_debut) {
      queryBuilder.andWhere('devis.created_at >= :date_debut', {
        date_debut: filtres.date_debut
      });
    }

    if (filtres.date_fin) {
      queryBuilder.andWhere('devis.created_at <= :date_fin', {
        date_fin: filtres.date_fin
      });
    }

    if (filtres.prime_min !== undefined) {
      queryBuilder.andWhere('devis.prime_calculee >= :prime_min', {
        prime_min: filtres.prime_min
      });
    }

    if (filtres.prime_max !== undefined) {
      queryBuilder.andWhere('devis.prime_calculee <= :prime_max', {
        prime_max: filtres.prime_max
      });
    }

    const total = await queryBuilder.getCount();

    const devis = await queryBuilder
      .orderBy('devis.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      devis: devis.map(d => this.formatDevisSauvegarde(d)),
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Nettoie les devis expirés (tâche planifiée)
   */
  async nettoyerDevisExpires(): Promise<{ devisNettoyes: number }> {
    const maintenant = new Date();

    const result = await this.devisSimuleRepository
      .createQueryBuilder()
      .update(DevisSimule)
      .set({ statut: StatutDevis.EXPIRE })
      .where('expires_at < :maintenant', { maintenant })
      .andWhere('statut = :statut', { statut: StatutDevis.SIMULATION })
      .execute();

    return { devisNettoyes: result.affected || 0 };
  }

  /**
   * Formate un devis pour la réponse API
   */
  private formatDevisSauvegarde(devis: DevisSimule): DevisSauvegardeDto {
    return {
      id: devis.id,
      reference: devis.reference,
      nom_produit: devis.produit?.nom || 'Produit inconnu',
      type_produit: devis.produit?.type || 'Type inconnu',
      prime_calculee: Number(devis.prime_calculee),
      franchise_calculee: Number(devis.franchise_calculee),
      plafond_calcule: devis.plafond_calcule ? Number(devis.plafond_calcule) : undefined,
      criteres_utilisateur: devis.criteres_utilisateur,
      informations_assure: devis.informations_assure,
      assure_est_souscripteur: devis.assure_est_souscripteur,
      nombre_documents: devis.documents?.length || 0,
      statut: devis.statut,
      created_at: devis.created_at,
      nom_personnalise: devis.nom_personnalise || undefined,
      notes: devis.notes || undefined,
      produit: devis.produit || undefined
    };
  }
}