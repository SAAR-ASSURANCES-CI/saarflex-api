import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsDate, IsEnum, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { StatutDevis } from '../entities/devis-simule.entity';

/**
 * DTO pour sauvegarder un devis simulé
 */
export class SauvegardeDevisDto {
  @ApiProperty({
    description: 'ID du devis simulé à sauvegarder',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  devis_id: string;

  @ApiProperty({
    description: 'Nom personnalisé pour le devis (optionnel)',
    example: 'Mon assurance vie familiale',
    required: false
  })
  @IsOptional()
  @IsString()
  nom_personnalise?: string;

  @ApiProperty({
    description: 'Notes personnelles sur le devis (optionnel)',
    example: 'Devis pour la famille, à revoir avec le conseiller',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour la réponse d'un devis sauvegardé
 */
export class DevisSauvegardeDto {
  @ApiProperty({
    description: 'ID unique du devis',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Nom du produit',
    example: 'Assurance Vie Épargne Plus'
  })
  nom_produit: string;

  @ApiProperty({
    description: 'Type de produit',
    example: 'vie'
  })
  type_produit: string;

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
    example: 1000000,
    required: false
  })
  plafond_calcule?: number;

  @ApiProperty({
    description: 'Critères utilisateur utilisés pour la simulation',
    example: { capital: 5000000, age: 35 }
  })
  criteres_utilisateur: Record<string, any>;

  @ApiProperty({
    description: 'Informations de l\'assuré',
    example: { nom: 'Jean Dupont', age: 35 },
    required: false
  })
  informations_assure?: Record<string, any>;

  @ApiProperty({
    description: 'L\'assuré est-il le souscripteur ?',
    example: true
  })
  assure_est_souscripteur: boolean;

  @ApiProperty({
    enum: StatutDevis,
    description: 'Statut du devis',
    example: StatutDevis.SAUVEGARDE
  })
  statut: StatutDevis;

  @ApiProperty({
    description: 'Date de création du devis'
  })
  created_at: Date;

  @ApiProperty({
    description: 'Nom personnalisé du devis',
    example: 'Mon assurance vie familiale',
    required: false
  })
  nom_personnalise?: string;

  @ApiProperty({
    description: 'Notes personnelles',
    example: 'Devis pour la famille',
    required: false
  })
  notes?: string;

  // @ApiProperty({
  //   description: 'Nombre de bénéficiaires associés',
  //   example: 2
  // })
  // nombre_beneficiaires: number;

  @ApiProperty({
    description: 'Nombre de documents d\'identité associés',
    example: 2
  })
  nombre_documents: number;
}

/**
 * DTO pour la réponse paginée des devis sauvegardés
 */
export class DevisSauvegardesResponseDto {
  @ApiProperty({
    type: [DevisSauvegardeDto],
    description: 'Liste des devis sauvegardés'
  })
  devis: DevisSauvegardeDto[];

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
 * DTO pour modifier un devis sauvegardé
 */
export class ModifierDevisSauvegardeDto {
  @ApiProperty({
    description: 'Nouveau nom personnalisé (optionnel)',
    example: 'Assurance vie mise à jour',
    required: false
  })
  @IsOptional()
  @IsString()
  nom_personnalise?: string;

  @ApiProperty({
    description: 'Nouvelles notes (optionnel)',
    example: 'Notes mises à jour',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour les filtres de recherche de devis
 */
export class FiltresRechercheDevisDto {
  @ApiProperty({
    description: 'Nom du produit (recherche partielle)',
    example: 'Assurance Vie',
    required: false
  })
  @IsOptional()
  @IsString()
  nom_produit?: string;

  @ApiProperty({
    description: 'Type de produit',
    example: 'vie',
    required: false
  })
  @IsOptional()
  @IsString()
  type_produit?: string;

  @ApiProperty({
    description: 'Date de début de recherche',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date_debut?: Date;

  @ApiProperty({
    description: 'Date de fin de recherche',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date_fin?: Date;

  @ApiProperty({
    description: 'Prime minimum',
    example: 10000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  prime_min?: number;

  @ApiProperty({
    description: 'Prime maximum',
    example: 50000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  prime_max?: number;
}
