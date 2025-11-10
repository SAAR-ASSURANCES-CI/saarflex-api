import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsDate, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StatutDevis } from '../entities/devis-simule.entity';

/**
 * DTO pour les filtres de recherche de devis (admin/agent)
 */
export class DevisListQueryDto {
  @ApiProperty({
    description: 'Statut du devis',
    enum: StatutDevis,
    required: false,
    example: StatutDevis.SAUVEGARDE
  })
  @IsOptional()
  @IsEnum(StatutDevis)
  statut?: StatutDevis;

  @ApiProperty({
    description: 'ID du produit',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  produit_id?: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur (client)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  utilisateur_id?: string;

  @ApiProperty({
    description: 'Date de début (YYYY-MM-DD)',
    required: false,
    example: '2024-01-01'
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date_debut?: Date;

  @ApiProperty({
    description: 'Date de fin (YYYY-MM-DD)',
    required: false,
    example: '2024-12-31'
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date_fin?: Date;

  @ApiProperty({
    description: 'Prime minimum en FCFA',
    required: false,
    example: 10000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prime_min?: number;

  @ApiProperty({
    description: 'Prime maximum en FCFA',
    required: false,
    example: 50000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prime_max?: number;

  @ApiProperty({
    description: 'Recherche textuelle (nom produit, nom client, email)',
    required: false,
    example: 'Assurance'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Numéro de page',
    required: false,
    default: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 10,
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

/**
 * DTO pour la réponse d'un devis avec toutes les informations (admin/agent)
 */
export class DevisAdminDto {
  @ApiProperty({
    description: 'ID unique du devis',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Référence unique du devis simulé',
    example: 'VIE-20241110-0001'
  })
  reference: string;

  @ApiProperty({
    description: 'Informations du produit',
    example: { id: '...', nom: 'Assurance Vie', type: 'vie' }
  })
  produit: {
    id: string;
    nom: string;
    type: string;
    description?: string;
  };

  @ApiProperty({
    description: 'Informations de la grille tarifaire',
    example: { id: '...', nom: 'Grille Standard' }
  })
  grille_tarifaire: {
    id: string;
    nom: string;
  };

  @ApiProperty({
    description: 'Informations du client (utilisateur)',
    required: false,
    example: { id: '...', nom: 'Jean Dupont', email: 'jean@example.com' }
  })
  utilisateur?: {
    id: string;
    nom: string;
    email: string;
    telephone?: string;
  };

  @ApiProperty({
    description: 'Critères utilisateur utilisés pour la simulation',
    example: { capital: 5000000, age: 35 }
  })
  criteres_utilisateur: Record<string, any>;

  @ApiProperty({
    description: 'Prime calculée en FCFA',
    example: 25000
  })
  prime_calculee: number;

  @ApiProperty({
    description: 'Franchise calculée en FCFA',
    example: 5000
  })
  franchise_calculee: number;

  @ApiProperty({
    description: 'Plafond calculé en FCFA (optionnel)',
    required: false,
    example: 1000000
  })
  plafond_calcule?: number;

  @ApiProperty({
    enum: StatutDevis,
    description: 'Statut du devis',
    example: StatutDevis.SAUVEGARDE
  })
  statut: StatutDevis;

  @ApiProperty({
    description: 'Date d\'expiration (pour les simulations)',
    required: false
  })
  expires_at?: Date | null;

  @ApiProperty({
    description: 'Nom personnalisé du devis',
    required: false,
    example: 'Mon assurance vie familiale'
  })
  nom_personnalise?: string;

  @ApiProperty({
    description: 'Notes personnelles',
    required: false,
    example: 'Devis pour la famille'
  })
  notes?: string;

  @ApiProperty({
    description: 'Informations de l\'assuré',
    required: false,
    example: { nom_complet: 'Jean Dupont', date_naissance: '1985-01-01' }
  })
  informations_assure?: Record<string, any>;

  @ApiProperty({
    description: 'L\'assuré est-il le souscripteur ?',
    example: true
  })
  assure_est_souscripteur: boolean;

  @ApiProperty({
    description: 'Nombre de documents d\'identité associés',
    example: 2
  })
  nombre_documents: number;

  @ApiProperty({
    description: 'Date de création du devis'
  })
  created_at: Date;
}

/**
 * DTO pour la réponse paginée des devis
 */
export class DevisListResponseDto {
  @ApiProperty({
    type: [DevisAdminDto],
    description: 'Liste des devis'
  })
  data: DevisAdminDto[];

  @ApiProperty({
    description: 'Nombre total de devis',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Numéro de page actuelle',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    example: 10
  })
  limit: number;

  @ApiProperty({
    description: 'Nombre total de pages',
    example: 3
  })
  totalPages: number;
}

/**
 * DTO pour modifier le statut d'un devis
 */
export class UpdateDevisStatutDto {
  @ApiProperty({
    enum: StatutDevis,
    description: 'Nouveau statut du devis',
    example: StatutDevis.PAYE
  })
  @IsEnum(StatutDevis)
  statut: StatutDevis;
}

/**
 * DTO pour les statistiques des devis
 */
export class DevisStatsDto {
  @ApiProperty({
    description: 'Nombre total de devis',
    example: 150
  })
  total: number;

  @ApiProperty({
    description: 'Nombre de devis par statut',
    example: {
      simulation: 20,
      sauvegarde: 50,
      en_attente_paiement: 30,
      paye: 40,
      converti_en_contrat: 8,
      expire: 2
    }
  })
  par_statut: Record<string, number>;

  @ApiProperty({
    description: 'Prime totale calculée en FCFA',
    example: 5000000
  })
  prime_totale: number;

  @ApiProperty({
    description: 'Nombre de devis créés ce mois',
    example: 25
  })
  ce_mois: number;
}

