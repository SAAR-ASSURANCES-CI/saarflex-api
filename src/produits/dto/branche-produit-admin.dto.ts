import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, Min, MaxLength, IsNotEmpty } from 'class-validator';
import { TypeBranche } from '../entities/branche-produit.entity';

export class CreateBrancheProduitDto {
  @ApiProperty({ 
    description: 'Nom de la branche de produit',
    example: 'Assurance Automobile',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({ 
    enum: TypeBranche,
    description: 'Type de la branche (vie ou non-vie)',
    example: 'non-vie'
  })
  @IsEnum(TypeBranche)
  type: TypeBranche;

  @ApiProperty({ 
    description: 'Description détaillée de la branche',
    example: 'Assurance couvrant les véhicules terrestres',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Ordre d\'affichage de la branche',
    example: 1,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;
}

export class UpdateBrancheProduitDto {
  @ApiProperty({ 
    description: 'Nom de la branche de produit',
    example: 'Assurance Automobile',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nom?: string;

  @ApiProperty({ 
    enum: TypeBranche,
    description: 'Type de la branche (vie ou non-vie)',
    example: 'non-vie',
    required: false
  })
  @IsOptional()
  @IsEnum(TypeBranche)
  type?: TypeBranche;

  @ApiProperty({ 
    description: 'Description détaillée de la branche',
    example: 'Assurance couvrant les véhicules terrestres',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Ordre d\'affichage de la branche',
    example: 1,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;
}

export class BrancheProduitAdminDto {
  @ApiProperty({ description: 'ID unique de la branche' })
  id: string;

  @ApiProperty({ description: 'Nom de la branche' })
  nom: string;

  @ApiProperty({ 
    enum: TypeBranche, 
    description: 'Type de la branche (vie ou non-vie)' 
  })
  type: TypeBranche;

  @ApiProperty({ description: 'Description de la branche' })
  description: string;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Nombre de produits dans cette branche' })
  nombre_produits: number;
}

export class BranchesResponseDto {
  @ApiProperty({ type: [BrancheProduitAdminDto] })
  branches: BrancheProduitAdminDto[];

  @ApiProperty({ description: 'Nombre total de branches' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  total_pages: number;
}
