import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';
import { StatutGrille } from '../entities/grille-tarifaire.entity';

export class CreateGrilleTarifaireDto {
  @ApiProperty({ 
    description: 'Nom de la grille tarifaire',
    example: 'Grille Standard 2024',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({ 
    description: 'ID du produit associé',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  produit_id: string;

  @ApiProperty({ 
    description: 'Date de début de validité de la grille',
    example: '2024-01-01'
  })
  @IsDateString()
  date_debut: string;

  @ApiProperty({ 
    description: 'Date de fin de validité de la grille (optionnelle)',
    example: '2024-12-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiProperty({ 
    enum: StatutGrille,
    description: 'Statut de la grille tarifaire',
    example: StatutGrille.INACTIF,
    default: StatutGrille.INACTIF
  })
  @IsOptional()
  @IsEnum(StatutGrille)
  statut?: StatutGrille;
}

export class UpdateGrilleTarifaireDto {
  @ApiProperty({ 
    description: 'Nom de la grille tarifaire',
    example: 'Grille Standard 2024 Mise à jour',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nom?: string;

  @ApiProperty({ 
    description: 'Date de début de validité de la grille',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiProperty({ 
    description: 'Date de fin de validité de la grille',
    example: '2024-12-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiProperty({ 
    enum: StatutGrille,
    description: 'Statut de la grille tarifaire',
    example: StatutGrille.ACTIF,
    required: false
  })
  @IsOptional()
  @IsEnum(StatutGrille)
  statut?: StatutGrille;
}

export class GrilleTarifaireDto {
  @ApiProperty({ description: 'ID unique de la grille tarifaire' })
  id: string;

  @ApiProperty({ description: 'Nom de la grille tarifaire' })
  nom: string;

  @ApiProperty({ description: 'ID du produit associé' })
  produit_id: string;

  @ApiProperty({ description: 'Date de début de validité' })
  date_debut: Date;

  @ApiProperty({ description: 'Date de fin de validité', required: false })
  date_fin?: Date;

  @ApiProperty({ enum: StatutGrille, description: 'Statut de la grille' })
  statut: StatutGrille;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updated_at: Date;

  @ApiProperty({ description: 'ID de l\'utilisateur créateur' })
  created_by: string;

  @ApiProperty({ description: 'Nombre de tarifs dans cette grille' })
  nombre_tarifs: number;
}

export class GrilleTarifaireWithProduitDto extends GrilleTarifaireDto {
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
    branche?: {
      id: string;
      nom: string;
      type: string;
      description?: string;
    };
  };
}

export class GrillesTarifairesResponseDto {
  @ApiProperty({ type: [GrilleTarifaireDto], description: 'Liste des grilles tarifaires' })
  grilles: GrilleTarifaireDto[];

  @ApiProperty({ description: 'Nombre total de grilles tarifaires' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}

export class GrillesTarifairesWithProduitResponseDto {
  @ApiProperty({ type: [GrilleTarifaireWithProduitDto], description: 'Liste des grilles tarifaires avec données du produit' })
  grilles: GrilleTarifaireWithProduitDto[];

  @ApiProperty({ description: 'Nombre total de grilles tarifaires' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}
