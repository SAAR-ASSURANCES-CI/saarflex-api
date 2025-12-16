import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { TypeGarantie, StatutGarantie } from '../entities/garantie.entity';

export class CreateGarantieDto {
  @ApiProperty({
    description: 'Nom de la garantie',
    example: 'Garantie vol et incendie'
  })
  @IsString()
  nom: string;

  @ApiProperty({
    description: 'Description détaillée de la garantie',
    example: 'Couverture contre le vol et les incendies du véhicule',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: TypeGarantie,
    description: 'Type de garantie (obligatoire ou optionnelle)',
    example: TypeGarantie.OBLIGATOIRE
  })
  @IsEnum(TypeGarantie)
  type: TypeGarantie;

  @ApiProperty({
    description: 'Montant garanti en FCFA',
    example: 500000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_garanti?: number;

  @ApiProperty({
    description: 'Franchise en FCFA',
    example: 50000,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  franchise?: number;

  @ApiProperty({
    description: 'Ordre d\'affichage de la garantie',
    example: 1,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordre?: number;

  @ApiProperty({
    description: 'ID du produit associé',
    example: 'uuid-du-produit'
  })
  @IsUUID()
  produit_id: string;

  @ApiProperty({
    enum: StatutGarantie,
    description: 'Statut de la garantie',
    example: StatutGarantie.ACTIVE,
    default: StatutGarantie.ACTIVE
  })
  @IsOptional()
  @IsEnum(StatutGarantie)
  statut?: StatutGarantie;
}

export class UpdateGarantieDto {
  @ApiProperty({
    description: 'Nom de la garantie',
    example: 'Garantie vol et incendie mise à jour',
    required: false
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({
    description: 'Description détaillée de la garantie',
    example: 'Couverture mise à jour contre le vol et les incendies',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: TypeGarantie,
    description: 'Type de garantie',
    example: TypeGarantie.OPTIONNELLE,
    required: false
  })
  @IsOptional()
  @IsEnum(TypeGarantie)
  type?: TypeGarantie;

  @ApiProperty({
    description: 'Montant garanti en FCFA',
    example: 750000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_garanti?: number;

  @ApiProperty({
    description: 'Franchise en FCFA',
    example: 75000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  franchise?: number;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordre?: number;

  @ApiProperty({
    enum: StatutGarantie,
    description: 'Statut de la garantie',
    example: StatutGarantie.INACTIVE,
    required: false
  })
  @IsOptional()
  @IsEnum(StatutGarantie)
  statut?: StatutGarantie;
}

export class GarantieDto {
  @ApiProperty({ description: 'ID unique de la garantie' })
  id: string;

  @ApiProperty({ description: 'Nom de la garantie' })
  nom: string;

  @ApiProperty({ description: 'Description de la garantie', required: false })
  description?: string;

  @ApiProperty({ enum: TypeGarantie, description: 'Type de garantie' })
  type: TypeGarantie;

  @ApiProperty({ description: 'Montant garanti en FCFA', required: false })
  montant_garanti?: number;

  @ApiProperty({ description: 'Franchise en FCFA' })
  franchise: number;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;

  @ApiProperty({ description: 'ID du produit associé' })
  produit_id: string;

  @ApiProperty({ enum: StatutGarantie, description: 'Statut de la garantie' })
  statut: StatutGarantie;

  @ApiProperty({ description: 'ID de l\'utilisateur créateur', required: false })
  created_by?: string;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updated_at: Date;
}

export class GarantiesResponseDto {
  @ApiProperty({ type: [GarantieDto], description: 'Liste des garanties' })
  garanties: GarantieDto[];

  @ApiProperty({ description: 'Nombre total de garanties' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}

export class GarantieWithProduitDto extends GarantieDto {
  @ApiProperty({
    description: 'Données du produit associé'
  })
  produit: {
    id: string;
    nom: string;
    icon?: string;
    type: string;
    description?: string;
    statut: string;
    necessite_beneficiaires: boolean;
    max_beneficiaires: number;
    necessite_informations_vehicule: boolean;
    periodicite_prime: string;
    branche?: {
      id: string;
      nom: string;
      type: string;
      description?: string;
    };
  };
}

export class GarantiesWithProduitResponseDto {
  @ApiProperty({ type: [GarantieWithProduitDto], description: 'Liste des garanties avec données du produit' })
  garanties: GarantieWithProduitDto[];

  @ApiProperty({ description: 'Nombre total de garanties' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}


