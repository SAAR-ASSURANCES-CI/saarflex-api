import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength, IsNotEmpty, IsBoolean, IsInt, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TypeCritere } from '../entities/critere-tarification.entity';
import { TypeProduit, StatutProduit } from '../entities/produit.entity';

export class CreateValeurCritereDto {
  @ApiProperty({ 
    description: 'Valeur du critère (pour type catégoriel ou booléen)',
    example: 'Béton',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  valeur?: string;

  @ApiProperty({ 
    description: 'Valeur minimale (pour type numérique)',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_min?: number;

  @ApiProperty({ 
    description: 'Valeur maximale (pour type numérique)',
    example: 1000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_max?: number;

  @ApiProperty({ 
    description: 'Ordre d\'affichage de la valeur',
    example: 1
  })
  @IsInt()
  @Min(1)
  ordre: number;
}

export class CreateCritereTarificationDto {
  @ApiProperty({ 
    description: 'ID du produit auquel appartient ce critère',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  produit_id: string;

  @ApiProperty({ 
    description: 'Nom du critère de tarification',
    example: 'Surface du logement',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({ 
    enum: TypeCritere,
    description: 'Type de critère (numérique, catégoriel ou booléen)',
    example: 'numerique'
  })
  @IsEnum(TypeCritere)
  type: TypeCritere;

  @ApiProperty({ 
    description: 'Unité de mesure (pour type numérique)',
    example: 'm²',
    required: false,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unite?: string;

  @ApiProperty({ 
    description: 'Ordre d\'affichage du critère',
    example: 1
  })
  @IsInt()
  @Min(1)
  ordre: number;

  @ApiProperty({ 
    description: 'Indique si le critère est obligatoire',
    example: true,
    default: true
  })
  @IsBoolean()
  obligatoire: boolean;

  @ApiProperty({ 
    description: 'Valeurs possibles pour ce critère',
    type: [CreateValeurCritereDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateValeurCritereDto)
  valeurs?: CreateValeurCritereDto[];
}

export class UpdateCritereTarificationDto {
  @ApiProperty({ 
    description: 'Nom du critère de tarification',
    example: 'Surface du logement',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nom?: string;

  @ApiProperty({ 
    enum: TypeCritere,
    description: 'Type de critère',
    example: 'numerique',
    required: false
  })
  @IsOptional()
  @IsEnum(TypeCritere)
  type?: TypeCritere;

  @ApiProperty({ 
    description: 'Unité de mesure',
    example: 'm²',
    required: false,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unite?: string;

  @ApiProperty({ 
    description: 'Ordre d\'affichage',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordre?: number;

  @ApiProperty({ 
    description: 'Critère obligatoire',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  obligatoire?: boolean;
}

export class UpdateValeurCritereDto {
  @ApiProperty({ 
    description: 'Valeur du critère',
    example: 'Béton',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  valeur?: string;

  @ApiProperty({ 
    description: 'Valeur minimale',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_min?: number;

  @ApiProperty({ 
    description: 'Valeur maximale',
    example: 1000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeur_max?: number;

  @ApiProperty({ 
    description: 'Ordre d\'affichage',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordre?: number;
}

export class ValeurCritereDto {
  @ApiProperty({ description: 'ID unique de la valeur' })
  id: string;

  @ApiProperty({ description: 'Valeur du critère' })
  valeur: string;

  @ApiProperty({ description: 'Valeur minimale' })
  valeur_min: number;

  @ApiProperty({ description: 'Valeur maximale' })
  valeur_max: number;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;
}

export class ProduitInfoDto {
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

  @ApiProperty({ description: 'Description du produit' })
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
}

export class CritereTarificationAdminDto {
  @ApiProperty({ description: 'ID unique du critère' })
  id: string;

  @ApiProperty({ description: 'ID du produit' })
  produit_id: string;

  @ApiProperty({ description: 'Nom du critère' })
  nom: string;

  @ApiProperty({ 
    enum: TypeCritere, 
    description: 'Type du critère' 
  })
  type: TypeCritere;

  @ApiProperty({ description: 'Unité de mesure' })
  unite: string;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;

  @ApiProperty({ description: 'Critère obligatoire' })
  obligatoire: boolean;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ 
    description: 'Valeurs possibles pour ce critère',
    type: [ValeurCritereDto]
  })
  valeurs: ValeurCritereDto[];

  @ApiProperty({ description: 'Nombre de valeurs associées' })
  nombre_valeurs: number;

  @ApiProperty({ 
    description: 'Informations du produit associé',
    type: ProduitInfoDto,
    required: false
  })
  produit?: ProduitInfoDto;
}

export class CriteresAdminResponseDto {
  @ApiProperty({ type: [CritereTarificationAdminDto] })
  criteres: CritereTarificationAdminDto[];

  @ApiProperty({ description: 'Nombre total de critères' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  total_pages: number;
}
