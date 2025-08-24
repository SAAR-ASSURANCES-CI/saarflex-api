import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength, IsNotEmpty, IsUrl } from 'class-validator';
import { TypeProduit, StatutProduit } from '../entities/produit.entity';

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

  @ApiProperty({ description: 'Informations de la branche' })
  branche: {
    id: string;
    nom: string;
    type: string;
    description: string;
  };

  @ApiProperty({ description: 'Nombre de critères de tarification' })
  nombre_criteres: number;

  @ApiProperty({ description: 'Nombre de grilles tarifaires' })
  nombre_grilles: number;

  @ApiProperty({ description: 'Nombre de formules de calcul' })
  nombre_formules: number;

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


