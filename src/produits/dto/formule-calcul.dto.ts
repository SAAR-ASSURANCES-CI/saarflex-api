import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, MaxLength, IsEnum } from 'class-validator';

export enum StatutFormule {
  ACTIF = 'actif',
  INACTIF = 'inactif'
}

export class CreateFormuleCalculDto {
  @ApiProperty({ 
    description: 'ID du produit d\'assurance',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  produit_id: string;

  @ApiProperty({ 
    description: 'Nom de la formule de calcul',
    example: 'Calcul prime auto avec bonus fidélité',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({ 
    description: 'Formule de calcul (expression mathématique)',
    example: 'prime_base * (1 + age > 25 ? 0.1 : 0.3) + bonus_fidelite',
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  formule: string;

  @ApiProperty({ 
    description: 'Variables utilisées dans la formule avec leurs types et valeurs par défaut',
    example: {
      prime_base: { type: 'number', default: 0, description: 'Prime de base' },
      age: { type: 'number', default: 18, description: 'Âge de l\'assuré' },
      bonus_fidelite: { type: 'number', default: 0, description: 'Bonus fidélité' }
    }
  })
  @IsObject()
  @IsNotEmpty()
  variables: Record<string, {
    type: 'number' | 'string' | 'boolean';
    default: any;
    description: string;
    required?: boolean;
  }>;

  @ApiProperty({ 
    enum: StatutFormule,
    description: 'Statut de la formule (actif par défaut)',
    example: 'actif',
    default: StatutFormule.ACTIF
  })
  @IsOptional()
  @IsEnum(StatutFormule)
  statut?: StatutFormule;
}

export class UpdateFormuleCalculDto {
  @ApiProperty({ 
    description: 'Nom de la formule de calcul',
    example: 'Calcul prime auto avec bonus fidélité',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nom?: string;

  @ApiProperty({ 
    description: 'Formule de calcul (expression mathématique)',
    example: 'prime_base * (1 + age > 25 ? 0.1 : 0.3) + bonus_fidelite',
    maxLength: 1000,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  formule?: string;

  @ApiProperty({ 
    description: 'Variables utilisées dans la formule',
    required: false
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, {
    type: 'number' | 'string' | 'boolean';
    default: any;
    description: string;
    required?: boolean;
  }>;

  @ApiProperty({ 
    enum: StatutFormule,
    description: 'Statut de la formule',
    example: 'actif',
    required: false
  })
  @IsOptional()
  @IsEnum(StatutFormule)
  statut?: StatutFormule;
}

export class FormuleCalculDto {
  @ApiProperty({ 
    description: 'ID unique de la formule',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'ID du produit d\'assurance',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  produit_id: string;

  @ApiProperty({ 
    description: 'Nom de la formule de calcul',
    example: 'Calcul prime auto avec bonus fidélité'
  })
  nom: string;

  @ApiProperty({ 
    description: 'Formule de calcul',
    example: 'prime_base * (1 + age > 25 ? 0.1 : 0.3) + bonus_fidelite'
  })
  formule: string;

  @ApiProperty({ 
    description: 'Variables de la formule',
    example: {
      prime_base: { type: 'number', default: 0, description: 'Prime de base' },
      age: { type: 'number', default: 18, description: 'Âge de l\'assuré' }
    }
  })
  variables: Record<string, any>;

  @ApiProperty({ 
    enum: StatutFormule,
    description: 'Statut de la formule',
    example: 'actif'
  })
  statut: StatutFormule;

  @ApiProperty({ 
    description: 'Date de création',
    example: '2024-01-15T10:30:00.000Z'
  })
  created_at: Date;

  @ApiProperty({ 
    description: 'Date de dernière modification',
    example: '2024-01-15T10:30:00.000Z'
  })
  updated_at: Date;
}

export class FormuleCalculWithProduitDto extends FormuleCalculDto {
  @ApiProperty({ 
    description: 'Informations du produit associé'
  })
  produit: {
    id: string;
    nom: string;
    type: string;
    branche?: {
      id: string;
      nom: string;
      type: string;
    };
  };
}

export class FormulesCalculResponseDto {
  @ApiProperty({ 
    description: 'Liste des formules de calcul',
    type: [FormuleCalculDto]
  })
  formules: FormuleCalculDto[];

  @ApiProperty({ 
    description: 'Nombre total de formules',
    example: 25
  })
  total: number;

  @ApiProperty({ 
    description: 'Page actuelle',
    example: 1
  })
  page: number;

  @ApiProperty({ 
    description: 'Nombre de formules par page',
    example: 10
  })
  limit: number;

  @ApiProperty({ 
    description: 'Nombre total de pages',
    example: 3
  })
  totalPages: number;
}

export class FormulesCalculWithProduitResponseDto {
  @ApiProperty({ 
    description: 'Liste des formules de calcul avec informations produit',
    type: [FormuleCalculWithProduitDto]
  })
  formules: FormuleCalculWithProduitDto[];

  @ApiProperty({ 
    description: 'Nombre total de formules',
    example: 25
  })
  total: number;

  @ApiProperty({ 
    description: 'Page actuelle',
    example: 1
  })
  page: number;

  @ApiProperty({ 
    description: 'Nombre de formules par page',
    example: 10
  })
  limit: number;

  @ApiProperty({ 
    description: 'Nombre total de pages',
    example: 3
  })
  totalPages: number;
}
