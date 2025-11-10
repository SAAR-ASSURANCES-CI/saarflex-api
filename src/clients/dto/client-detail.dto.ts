import { StatutDevis } from '../../produits/entities/devis-simule.entity';

/**
 * DTO pour les détails complets d'un client
 */
export class ClientDetailDto {
  // Informations de base
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  statut: boolean;
  derniere_connexion: Date | null;
  date_creation: Date;

  // Informations du profil
  profile: ClientProfileDto | null;

  // Statistiques
  stats: ClientStatsDto;

  // Historiques
  devis: ClientDevisDto[];
  contrats: ClientContratDto[];
  paiements: ClientPaiementDto[];
}

/**
 * DTO pour le profil d'un client
 */
export class ClientProfileDto {
  lieu_naissance: string | null;
  sexe: string | null;
  nationalite: string | null;
  profession: string | null;
  adresse: string | null;
  date_naissance: Date | null;
  numero_piece_identite: string | null;
  type_piece_identite: string | null;
  date_expiration_piece_identite: Date | null;
  front_document_path?: string | null;
  back_document_path?: string | null;
}

/**
 * DTO pour les statistiques d'un client
 */
export class ClientStatsDto {
  totalPrimes: number;
  contratsActifs: number;
  contratsExpires: number;
  devisEnAttente: number;
  devisSauvegardes: number;
}

/**
 * DTO pour un devis dans l'historique
 */
export class ClientDevisDto {
  id: string;
  reference: string;
  produit_nom: string;
  prime_calculee: number;
  statut: string;
  statut_code: StatutDevis;
  created_at: Date;
}

/**
 * DTO pour un contrat dans l'historique
 */
export class ClientContratDto {
  id: string;
  numero_contrat: string;
  produit_nom: string;
  date_debut: Date;
  date_fin: Date;
  statut: string;
  prime_totale: number;
}

/**
 * DTO pour un paiement dans l'historique
 */
export class ClientPaiementDto {
  id: string;
  reference_paiement: string;
  montant: number;
  methode_paiement: string;
  statut: string;
  date_paiement: Date | null;
  created_at: Date;
}

