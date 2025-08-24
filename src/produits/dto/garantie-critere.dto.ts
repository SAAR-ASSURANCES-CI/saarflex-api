import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { OperateurCritere } from '../entities/garantie-critere.entity';

export class CreateGarantieCritereDto {
  @ApiProperty({ 
    description: 'ID du critère de tarification',
    example: 'uuid-du-critere'
  })
  @IsUUID()
  critere_id: string;

  @ApiProperty({ 
    description: 'Valeur requise pour activer la garantie',
    example: 'oui',
    required: false
  })
  @IsOptional()
  @IsString()
  valeur_requise?: string;

  @ApiProperty({ 
    description: 'Valeur minimale requise (pour critères numériques)',
    example: 18,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_min_requise?: number;

  @ApiProperty({ 
    description: 'Valeur maximale requise (pour critères numériques)',
    example: 65,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_max_requise?: number;

  @ApiProperty({ 
    enum: OperateurCritere,
    description: 'Opérateur de comparaison',
    example: OperateurCritere.ENTRE,
    default: OperateurCritere.EGAL
  })
  @IsOptional()
  @IsEnum(OperateurCritere)
  operateur?: OperateurCritere = OperateurCritere.EGAL;
}

export class GarantieCritereDto {
  @ApiProperty({ description: 'ID unique de la condition' })
  id: string;

  @ApiProperty({ description: 'ID de la garantie' })
  garantie_id: string;

  @ApiProperty({ description: 'ID du critère' })
  critere_id: string;

  @ApiProperty({ description: 'Valeur requise', required: false })
  valeur_requise?: string;

  @ApiProperty({ description: 'Valeur minimale requise', required: false })
  valeur_min_requise?: number;

  @ApiProperty({ description: 'Valeur maximale requise', required: false })
  valeur_max_requise?: number;

  @ApiProperty({ enum: OperateurCritere, description: 'Opérateur de comparaison' })
  operateur: OperateurCritere;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  // Informations du critère associé
  @ApiProperty({ description: 'Nom du critère', required: false })
  critere_nom?: string;

  @ApiProperty({ description: 'Type du critère', required: false })
  critere_type?: string;

  @ApiProperty({ description: 'Unité du critère', required: false })
  critere_unite?: string;
}

// DTO pour la mise à jour d'une condition de garantie
export class UpdateGarantieCritereDto {
  @ApiProperty({ 
    description: 'Valeur requise pour activer la garantie',
    example: 'non',
    required: false
  })
  @IsOptional()
  @IsString()
  valeur_requise?: string;

  @ApiProperty({ 
    description: 'Valeur minimale requise',
    example: 21,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_min_requise?: number;

  @ApiProperty({ 
    description: 'Valeur maximale requise',
    example: 70,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_max_requise?: number;

  @ApiProperty({ 
    enum: OperateurCritere,
    description: 'Opérateur de comparaison',
    example: OperateurCritere.SUPERIEUR,
    required: false
  })
  @IsOptional()
  @IsEnum(OperateurCritere)
  operateur?: OperateurCritere;
}

export class GarantieAvecCriteresDto {
  @ApiProperty({ description: 'ID unique de la garantie' })
  id: string;

  @ApiProperty({ description: 'Nom de la garantie' })
  nom: string;

  @ApiProperty({ description: 'Description de la garantie', required: false })
  description?: string;

  @ApiProperty({ description: 'Type de garantie' })
  type: string;

  @ApiProperty({ description: 'Montant garanti en FCFA', required: false })
  montant_garanti?: number;

  @ApiProperty({ description: 'Franchise en FCFA' })
  franchise: number;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;

  @ApiProperty({ description: 'Statut de la garantie' })
  statut: string;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updated_at: Date;

  @ApiProperty({ 
    type: [GarantieCritereDto], 
    description: 'Critères conditionnels de la garantie',
    required: false
  })
  criteres_conditionnels?: GarantieCritereDto[];

  @ApiProperty({ description: 'Nombre de critères conditionnels' })
  nombre_criteres: number;
}
