import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from '../users/entities/user.entity';
import { Profile } from '../users/entities/profile.entity';
import { DevisSimule, StatutDevis } from '../produits/entities/devis-simule.entity';
import { Contrat, StatutContrat } from '../produits/entities/contrat.entity';
import { Paiement, StatutPaiement } from '../produits/entities/paiement.entity';
import { SessionService } from '../users/services/session.service';
import {
  ClientListQueryDto,
  ClientListResponseDto,
  ClientItemDto,
} from './dto/client-list.dto';
import {
  ClientDetailDto,
  ClientProfileDto,
  ClientStatsDto,
  ClientDevisDto,
  ClientContratDto,
  ClientPaiementDto,
} from './dto/client-detail.dto';
import { UpdateClientDto } from './dto/update-client.dto';

/**
 * Service responsable de la gestion des clients
 */
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(DevisSimule)
    private readonly devisRepository: Repository<DevisSimule>,
    @InjectRepository(Contrat)
    private readonly contratRepository: Repository<Contrat>,
    @InjectRepository(Paiement)
    private readonly paiementRepository: Repository<Paiement>,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Récupère la liste des clients avec pagination, recherche et filtres
   */
  async getClients(query: ClientListQueryDto): Promise<ClientListResponseDto> {
    const { search, statut, page = 1, limit = 10 } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.type_utilisateur = :type', { type: UserType.CLIENT })
      .orderBy('user.date_creation', 'DESC');

    // Recherche par nom ou email
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(LOWER(user.nom) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
    }

    // Filtre par statut
    if (statut !== undefined) {
      queryBuilder.andWhere('user.statut = :statut', { statut });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Exécution
    const [clients, total] = await queryBuilder.getManyAndCount();

    // Transformation en DTO
    const data: ClientItemDto[] = clients.map((client) => ({
      id: client.id,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      statut: client.statut,
      derniere_connexion: client.derniere_connexion,
      date_creation: client.date_creation,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère les détails complets d'un client
   */
  async getClientById(id: string): Promise<ClientDetailDto> {
    
    const client = await this.userRepository.findOne({
      where: { id, type_utilisateur: UserType.CLIENT },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    const profile = await this.profileRepository.findOne({
      where: { user_id: id },
    });

    const devis = await this.devisRepository
      .createQueryBuilder('devis')
      .innerJoinAndSelect('devis.produit', 'produit')
      .where('devis.utilisateur_id = :userId', { userId: id })
      .orderBy('devis.created_at', 'DESC')
      .getMany();

    const contrats = await this.contratRepository
      .createQueryBuilder('contrat')
      .innerJoinAndSelect('contrat.produit', 'produit')
      .where('contrat.utilisateur_id = :userId', { userId: id })
      .orderBy('contrat.date_debut_couverture', 'DESC')
      .getMany();

    const paiements = await this.paiementRepository
      .createQueryBuilder('paiement')
      .where('paiement.utilisateur_id = :userId', { userId: id })
      .orderBy('paiement.created_at', 'DESC')
      .getMany();

    const stats = this.calculateClientStats(devis, contrats, paiements);

    return {
      id: client.id,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      statut: client.statut,
      derniere_connexion: client.derniere_connexion,
      date_creation: client.date_creation,
      profile: profile ? this.mapProfileToDto(profile) : null,
      stats,
      devis: this.mapDevisToDto(devis),
      contrats: this.mapContratsToDto(contrats),
      paiements: this.mapPaiementsToDto(paiements),
    };
  }

  /**
   * Met à jour les informations d'un client
   */
  async updateClient(id: string, dto: UpdateClientDto): Promise<ClientDetailDto> {
    const client = await this.userRepository.findOne({
      where: { id, type_utilisateur: UserType.CLIENT },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    if (dto.email && dto.email !== client.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase().trim() },
      });

      if (emailExists) {
        throw new BadRequestException('Cet email est déjà utilisé');
      }
    }

    if (dto.telephone && dto.telephone !== client.telephone) {
      const phoneExists = await this.userRepository.findOne({
        where: { telephone: dto.telephone.trim() },
      });

      if (phoneExists) {
        throw new BadRequestException('Ce numéro de téléphone est déjà utilisé');
      }
    }

    await this.userRepository.update(id, {
      ...(dto.nom && { nom: dto.nom.trim() }),
      ...(dto.email && { email: dto.email.toLowerCase().trim() }),
      ...(dto.telephone && { telephone: dto.telephone.trim() }),
    });

    return this.getClientById(id);
  }

  /**
   * Bascule le statut d'un client (actif/inactif)
   */
  async toggleClientStatus(id: string): Promise<{ statut: boolean; message: string }> {
    const client = await this.userRepository.findOne({
      where: { id, type_utilisateur: UserType.CLIENT },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    const newStatut = !client.statut;

    await this.userRepository.update(id, { statut: newStatut });

    if (!newStatut) {
      await this.sessionService.invalidateAllUserSessions(id);
    }

    return {
      statut: newStatut,
      message: newStatut
        ? 'Client débloqué avec succès'
        : 'Client bloqué avec succès. Toutes ses sessions ont été invalidées.',
    };
  }

  /**
   * Calcule les statistiques d'un client
   */
  private calculateClientStats(
    devis: DevisSimule[],
    contrats: Contrat[],
    paiements: Paiement[],
  ): ClientStatsDto {
    const totalPrimes = paiements
      .filter((p) => p.statut === StatutPaiement.REUSSI)
      .reduce((sum, p) => sum + Number(p.montant), 0);

    const contratsActifs = contrats.filter(
      (c) => c.statut === StatutContrat.ACTIF,
    ).length;

    const contratsExpires = contrats.filter(
      (c) => c.statut === StatutContrat.EXPIRE,
    ).length;

    const devisEnAttente = devis.filter(
      (d) =>
        d.statut === StatutDevis.SIMULATION ||
        d.statut === StatutDevis.EN_ATTENTE_PAIEMENT,
    ).length;

    // Devis sauvegardés
    const devisSauvegardes = devis.filter(
      (d) => d.statut === StatutDevis.SAUVEGARDE,
    ).length;

    return {
      totalPrimes,
      contratsActifs,
      contratsExpires,
      devisEnAttente,
      devisSauvegardes,
    };
  }

  /**
   * Transforme un profil en DTO
   */
  private mapProfileToDto(profile: Profile): ClientProfileDto {
    return {
      lieu_naissance: profile.lieu_naissance,
      sexe: profile.sexe,
      nationalite: profile.nationalite,
      profession: profile.profession,
      adresse: profile.adresse,
      date_naissance: profile.date_naissance,
      numero_piece_identite: profile.numero_piece_identite,
      type_piece_identite: profile.type_piece_identite,
      date_expiration_piece_identite: profile.date_expiration_piece_identite,
      front_document_path: profile.chemin_recto_piece ?? null,
      back_document_path: profile.chemin_verso_piece ?? null,
    };
  }

  /**
   * Transforme les devis en DTO
   */
  private mapDevisToDto(devis: DevisSimule[]): ClientDevisDto[] {
    return devis.map((d) => ({
      id: d.id,
      reference: d.reference,
      produit_nom: d.produit.nom,
      prime_calculee: Number(d.prime_calculee),
      statut: this.formatDevisStatus(d.statut),
      statut_code: d.statut,
      created_at: d.created_at,
    }));
  }

  /**
   * Transforme les contrats en DTO
   */
  private mapContratsToDto(contrats: Contrat[]): ClientContratDto[] {
    return contrats.map((c) => ({
      id: c.id,
      numero_contrat: c.numero_contrat,
      produit_nom: c.produit.nom,
      date_debut: c.date_debut_couverture,
      date_fin: c.date_fin_couverture,
      statut:
        c.statut === StatutContrat.ACTIF
          ? 'Actif'
          : c.statut === StatutContrat.EXPIRE
          ? 'Expiré'
          : c.statut === StatutContrat.SUSPENDU
          ? 'Suspendu'
          : 'Résilié',
      prime_totale: Number(c.prime_mensuelle),
    }));
  }

  /**
   * Transforme les paiements en DTO
   */
  private mapPaiementsToDto(paiements: Paiement[]): ClientPaiementDto[] {
    return paiements.map((p) => ({
      id: p.id,
      reference_paiement: p.reference_paiement,
      montant: Number(p.montant),
      methode_paiement: this.formatMethodePaiement(p.methode_paiement),
      statut: this.formatStatutPaiement(p.statut),
      date_paiement: p.date_paiement,
      created_at: p.created_at,
    }));
  }

  /**
   * Formate la méthode de paiement pour l'affichage
   */
  private formatMethodePaiement(methode: string): string {
    const mapping = {
      wave: 'Wave',
      orange_money: 'Orange Money',
      carte_bancaire: 'Carte Bancaire',
      virement: 'Virement',
      especes: 'Espèces',
    };
    return mapping[methode] || methode;
  }

  /**
   * Formate le statut de paiement pour l'affichage
   */
  private formatStatutPaiement(statut: string): string {
    const mapping = {
      en_attente: 'En attente',
      reussi: 'Réussi',
      echoue: 'Échoué',
      rembourse: 'Remboursé',
      annule: 'Annulé',
    };
    return mapping[statut] || statut;
  }

  /**
   * Formate le statut d'un devis pour l'affichage
   */
  private formatDevisStatus(statut: StatutDevis): string {
    switch (statut) {
      case StatutDevis.SAUVEGARDE:
        return 'Sauvegardé';
      case StatutDevis.EN_ATTENTE_PAIEMENT:
        return 'En attente de paiement';
      case StatutDevis.PAYE:
        return 'Payé';
      case StatutDevis.CONVERTI_EN_CONTRAT:
        return 'Converti en contrat';
      case StatutDevis.EXPIRE:
        return 'Expiré';
      case StatutDevis.SIMULATION:
      default:
        return 'Simulé';
    }
  }
}

