import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { StatutTarifGarantie, TypeCalculTarif } from '../entities/tarif-garantie.entity';

export class CreateTarifGarantieDto {
  @ApiProperty({
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @IsUUID()
  garantie_id: string;

  @ApiProperty({
    enum: TypeCalculTarif,
    description: 'Type de calcul du tarif',
    example: TypeCalculTarif.MONTANT_FIXE,
    default: TypeCalculTarif.MONTANT_FIXE
  })
  @IsOptional()
  @IsEnum(TypeCalculTarif)
  type_calcul?: TypeCalculTarif = TypeCalculTarif.MONTANT_FIXE;

  @ApiProperty({
    description: 'Taux de pourcentage pour calcul sur VN ou VV (ex: 3.5 pour 3.5%)',
    example: 3.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taux_pourcentage?: number;

  @ApiProperty({
    description: 'Montant de base en FCFA (utilisé si type_calcul = MONTANT_FIXE)',
    example: 25000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_base?: number;

  @ApiProperty({
    description: 'Pourcentage appliqué sur le montant du produit',
    example: 2.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pourcentage_produit?: number;

  @ApiProperty({
    description: 'Formule de calcul personnalisée',
    example: 'montant_base + (valeur_vehicule * 0.01)',
    required: false
  })
  @IsOptional()
  @IsString()
  formule_calcul?: string;

  @ApiProperty({
    description: 'Date de début de validité du tarif',
    example: '2025-01-01'
  })
  @IsDateString()
  date_debut: string;

  @ApiProperty({
    description: 'Date de fin de validité du tarif',
    example: '2025-12-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiProperty({
    enum: StatutTarifGarantie,
    description: 'Statut du tarif',
    example: StatutTarifGarantie.ACTIF,
    default: StatutTarifGarantie.ACTIF
  })
  @IsOptional()
  @IsEnum(StatutTarifGarantie)
  statut?: StatutTarifGarantie = StatutTarifGarantie.ACTIF;
}

export class UpdateTarifGarantieDto {
  @ApiProperty({
    enum: TypeCalculTarif,
    description: 'Type de calcul du tarif',
    example: TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE,
    required: false
  })
  @IsOptional()
  @IsEnum(TypeCalculTarif)
  type_calcul?: TypeCalculTarif;

  @ApiProperty({
    description: 'Taux de pourcentage pour calcul sur VN ou VV (ex: 3.5 pour 3.5%)',
    example: 3.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taux_pourcentage?: number;

  @ApiProperty({
    description: 'Montant de base en FCFA',
    example: 30000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_base?: number;

  @ApiProperty({
    description: 'Pourcentage appliqué sur le montant du produit',
    example: 3.0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pourcentage_produit?: number;

  @ApiProperty({
    description: 'Formule de calcul personnalisée',
    example: 'montant_base + (valeur_vehicule * 0.015)',
    required: false
  })
  @IsOptional()
  @IsString()
  formule_calcul?: string;

  @ApiProperty({
    description: 'Date de début de validité',
    example: '2025-06-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiProperty({
    description: 'Date de fin de validité',
    example: '2026-05-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiProperty({
    enum: StatutTarifGarantie,
    description: 'Statut du tarif',
    example: StatutTarifGarantie.INACTIF,
    required: false
  })
  @IsOptional()
  @IsEnum(StatutTarifGarantie)
  statut?: StatutTarifGarantie;
}

export class TarifGarantieDto {
  @ApiProperty({ description: 'ID unique du tarif' })
  id: string;

  @ApiProperty({ description: 'ID de la garantie' })
  garantie_id: string;

  @ApiProperty({ enum: TypeCalculTarif, description: 'Type de calcul du tarif' })
  type_calcul: TypeCalculTarif;

  @ApiProperty({ description: 'Taux de pourcentage pour calcul sur VN ou VV', required: false })
  taux_pourcentage?: number;

  @ApiProperty({ description: 'Montant de base en FCFA', required: false })
  montant_base?: number;

  @ApiProperty({ description: 'Pourcentage appliqué sur le produit', required: false })
  pourcentage_produit?: number;

  @ApiProperty({ description: 'Formule de calcul personnalisée', required: false })
  formule_calcul?: string;

  @ApiProperty({ description: 'Date de début de validité' })
  date_debut: Date;

  @ApiProperty({ description: 'Date de fin de validité', required: false })
  date_fin?: Date;

  @ApiProperty({ enum: StatutTarifGarantie, description: 'Statut du tarif' })
  statut: StatutTarifGarantie;

  @ApiProperty({ description: 'ID de l\'utilisateur créateur', required: false })
  created_by?: string;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updated_at: Date;
}

export class TarifsGarantieResponseDto {
  @ApiProperty({ type: [TarifGarantieDto], description: 'Liste des tarifs' })
  tarifs: TarifGarantieDto[];

  @ApiProperty({ description: 'Nombre total de tarifs' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}


