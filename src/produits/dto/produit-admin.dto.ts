import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength, IsNotEmpty, IsUrl, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { TypeProduit, StatutProduit, PeriodicitePrime } from '../entities/produit.entity';

export class CreateProduitDto {
  @ApiProperty({ 
    description: 'Nom du produit d\'assurance',
    example: 'Assurance Auto Premium',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({ 
    description: 'Icône du produit (chemin ou URL)',
    example: 'icon-auto-premium.svg',
    required: false
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ 
    enum: TypeProduit,
    description: 'Type de produit (vie ou non-vie)',
    example: 'non-vie'
  })
  @IsEnum(TypeProduit)
  type: TypeProduit;

  @ApiProperty({ 
    description: 'Description détaillée du produit',
    example: 'Assurance automobile complète avec garanties étendues',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Lien vers les conditions générales PDF',
    example: '/pdf/conditions-auto-premium.pdf',
    required: false
  })
  @IsOptional()
  @IsString()
  conditions_pdf?: string;

  @ApiProperty({ 
    enum: StatutProduit,
    description: 'Statut du produit (brouillon par défaut)',
    example: 'brouillon'
  })
  @IsOptional()
  @IsEnum(StatutProduit)
  statut?: StatutProduit;

  @ApiProperty({ 
    description: 'ID de la branche à laquelle appartient ce produit',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  branch_id: string;

  @ApiProperty({ 
    description: 'Le produit nécessite-t-il des bénéficiaires ?',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  necessite_beneficiaires?: boolean;

  @ApiProperty({ 
    description: 'Nombre maximum de bénéficiaires autorisés',
    example: 2,
    minimum: 0,
    maximum: 5,
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  max_beneficiaires?: number;

  @ApiProperty({ 
    enum: PeriodicitePrime,
    description: 'Périodicité de paiement de la prime',
    example: PeriodicitePrime.MENSUEL,
    default: PeriodicitePrime.MENSUEL
  })
  @IsOptional()
  @IsEnum(PeriodicitePrime)
  periodicite_prime?: PeriodicitePrime;
}

export class UpdateProduitDto {
  @ApiProperty({ 
    description: 'Nom du produit d\'assurance',
    example: 'Assurance Auto Premium',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nom?: string;

  @ApiProperty({ 
    description: 'Icône du produit (chemin ou URL)',
    example: 'icon-auto-premium.svg',
    required: false
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ 
    enum: TypeProduit,
    description: 'Type de produit (vie ou non-vie)',
    example: 'non-vie',
    required: false
  })
  @IsOptional()
  @IsEnum(TypeProduit)
  type?: TypeProduit;

  @ApiProperty({ 
    description: 'Description détaillée du produit',
    example: 'Assurance automobile complète avec garanties étendues',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Lien vers les conditions générales PDF',
    example: '/pdf/conditions-auto-premium.pdf',
    required: false
  })
  @IsOptional()
  @IsString()
  conditions_pdf?: string;

  @ApiProperty({ 
    enum: StatutProduit,
    description: 'Statut du produit',
    example: 'actif',
    required: false
  })
  @IsOptional()
  @IsEnum(StatutProduit)
  statut?: StatutProduit;

  @ApiProperty({ 
    description: 'ID de la branche à laquelle appartient ce produit',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiProperty({ 
    description: 'Le produit nécessite-t-il des bénéficiaires ?',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  necessite_beneficiaires?: boolean;

  @ApiProperty({ 
    description: 'Nombre maximum de bénéficiaires autorisés',
    example: 2,
    minimum: 0,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  max_beneficiaires?: number;

  @ApiProperty({ 
    enum: PeriodicitePrime,
    description: 'Périodicité de paiement de la prime',
    example: PeriodicitePrime.MENSUEL,
    required: false
  })
  @IsOptional()
  @IsEnum(PeriodicitePrime)
  periodicite_prime?: PeriodicitePrime;
}

export class ProduitAdminDto {
  @ApiProperty({ description: 'ID unique du produit' })
  id: string;

  @ApiProperty({ description: 'Nom du produit' })
  nom: string;

  @ApiProperty({ description: 'Icône du produit' })
  icon: string;

  @ApiProperty({ 
    enum: TypeProduit, 
    description: 'Type du produit (vie ou non-vie)' 
  })
  type: TypeProduit;

  @ApiProperty({ description: 'Description détaillée du produit' })
  description: string;

  @ApiProperty({ description: 'Lien vers les conditions PDF' })
  conditions_pdf: string;

  @ApiProperty({ 
    enum: StatutProduit, 
    description: 'Statut du produit' 
  })
  statut: StatutProduit;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updated_at: Date;

  @ApiProperty({ description: 'ID de l\'utilisateur qui a créé le produit' })
  created_by: string;

  @ApiProperty({ 
    description: 'Le produit nécessite-t-il des bénéficiaires ?',
    example: true
  })
  necessite_beneficiaires: boolean;

  @ApiProperty({ 
    description: 'Nombre maximum de bénéficiaires autorisés',
    example: 2
  })
  max_beneficiaires: number;

  @ApiProperty({ 
    enum: PeriodicitePrime,
    description: 'Périodicité de paiement de la prime',
    example: PeriodicitePrime.MENSUEL
  })
  periodicite_prime: PeriodicitePrime;

  @ApiProperty({ description: 'Informations de la branche', nullable: true })
  branche: {
    id: string;
    nom: string;
    type: string;
    description: string;
  } | null;

  @ApiProperty({ description: 'Nombre de critères de tarification' })
  nombre_criteres: number;

  @ApiProperty({ description: 'Nombre de grilles tarifaires' })
  nombre_grilles: number;

  @ApiProperty({ description: 'Nombre de devis simulés' })
  nombre_devis: number;
}

export class ProduitsAdminResponseDto {
  @ApiProperty({ type: [ProduitAdminDto] })
  produits: ProduitAdminDto[];

  @ApiProperty({ description: 'Nombre total de produits' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  total_pages: number;
}


