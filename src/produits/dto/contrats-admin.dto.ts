import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsDate, IsEnum, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StatutContrat } from '../entities/contrat.entity';

/**
 * DTO pour les filtres de recherche de contrats (admin/agent)
 */
export class ContratsListQueryDto {
  @ApiProperty({
    description: 'Statut du contrat',
    enum: StatutContrat,
    required: false,
    example: StatutContrat.ACTIF
  })
  @IsOptional()
  @IsEnum(StatutContrat)
  statut?: StatutContrat;

  @ApiProperty({
    description: 'ID du produit',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  produit_id?: string;

  @ApiProperty({
    description: "ID de l'utilisateur (client)",
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  utilisateur_id?: string;

  @ApiProperty({
    description: 'Date de début de couverture (YYYY-MM-DD)',
    required: false,
    example: '2024-01-01'
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date_debut?: Date;

  @ApiProperty({
    description: 'Date de fin de couverture (YYYY-MM-DD)',
    required: false,
    example: '2024-12-31'
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date_fin?: Date;

  @ApiProperty({
    description: 'Prime minimale (mensuelle) en FCFA',
    required: false,
    example: 10000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prime_min?: number;

  @ApiProperty({
    description: 'Prime maximale (mensuelle) en FCFA',
    required: false,
    example: 50000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prime_max?: number;

  @ApiProperty({
    description: 'Recherche textuelle (numéro, nom produit, nom client, email)',
    required: false,
    example: 'VIE-2025'
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
    description: "Nombre d'éléments par page",
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
 * DTO pour la réponse d'un contrat (admin/agent)
 */
export class ContratBeneficiaireDto {
  @ApiProperty({ description: 'Nom complet du bénéficiaire', example: 'Jean Dupont' })
  nom_complet: string;

  @ApiProperty({ description: 'Lien avec le souscripteur', example: 'Épouse' })
  lien_souscripteur: string;

  @ApiProperty({ description: 'Ordre de priorité du bénéficiaire', example: 1 })
  ordre: number;
}

export class ContratAdminDto {
  @ApiProperty({ description: 'ID unique du contrat' })
  id: string;

  @ApiProperty({ description: 'Numéro unique du contrat', example: 'VIE-2025-000001' })
  numero_contrat: string;

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

  @ApiProperty({ description: 'Informations de la grille tarifaire', example: { id: '...', nom: 'Grille Standard' } })
  grille_tarifaire: { id: string; nom: string };

  @ApiProperty({ description: 'Informations du client (utilisateur)', required: false })
  utilisateur?: { id: string; nom: string; email: string; telephone?: string };

  @ApiProperty({ description: 'Critères utilisateur', example: { capital: 5000000, age: 35 } })
  criteres_utilisateur: Record<string, any>;

  @ApiProperty({ description: 'Prime mensuelle en FCFA', example: 25000 })
  prime_mensuelle: number;

  @ApiProperty({ description: 'Franchise en FCFA', example: 5000 })
  franchise: number;

  @ApiProperty({ description: 'Plafond en FCFA', required: false, example: 1000000 })
  plafond?: number;

  @ApiProperty({ enum: StatutContrat, description: 'Statut du contrat', example: StatutContrat.ACTIF })
  statut: StatutContrat;

  @ApiProperty({ description: 'Date de début de couverture' })
  date_debut_couverture: Date;

  @ApiProperty({ description: 'Date de fin de couverture' })
  date_fin_couverture: Date;

  @ApiProperty({ description: "Nombre de bénéficiaires associés", example: 2 })
  nombre_beneficiaires: number;

  @ApiProperty({ description: 'Date de création du contrat' })
  created_at: Date;

  @ApiProperty({
    description: 'Liste des bénéficiaires associés',
    type: [ContratBeneficiaireDto],
    required: false,
  })
  beneficiaires?: ContratBeneficiaireDto[];
}

/**
 * DTO pour la réponse paginée des contrats
 */
export class ContratsListResponseDto {
  @ApiProperty({ type: [ContratAdminDto], description: 'Liste des contrats' })
  data: ContratAdminDto[];

  @ApiProperty({ description: 'Nombre total de contrats', example: 25 })
  total: number;

  @ApiProperty({ description: 'Numéro de page actuelle', example: 1 })
  page: number;

  @ApiProperty({ description: "Nombre d'éléments par page", example: 10 })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages', example: 3 })
  totalPages: number;
}

/**
 * DTO pour modifier le statut d'un contrat
 */
export class UpdateContratStatutDto {
  @ApiProperty({ enum: StatutContrat, description: 'Nouveau statut', example: StatutContrat.SUSPENDU })
  @IsEnum(StatutContrat)
  statut: StatutContrat;
}

/**
 * DTO pour les statistiques des contrats
 */
export class ContratsStatsDto {
  @ApiProperty({ description: 'Nombre total de contrats', example: 150 })
  total: number;

  @ApiProperty({ description: 'Nombre de contrats par statut' })
  par_statut: Record<string, number>;

  @ApiProperty({ description: 'Somme des primes mensuelles', example: 5000000 })
  primes_totales: number;

  @ApiProperty({ description: 'Nombre de contrats créés ce mois', example: 25 })
  ce_mois: number;
}


