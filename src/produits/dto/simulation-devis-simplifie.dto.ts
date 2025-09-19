import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsObject, IsBoolean, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBeneficiaireDto } from './beneficiaire.dto';

// DTO pour les informations d'une autre personne à assurer
export class InformationsAssureDto {
  @ApiProperty({ 
    description: 'Nom complet de la personne à assurer',
    example: 'Jean Martin'
  })
  @IsString()
  @IsNotEmpty()
  nom_complet: string;

  @ApiProperty({ 
    description: 'Date de naissance (format DD-MM-YYYY)',
    example: '15-06-1985'
  })
  @IsString()
  @IsNotEmpty()
  date_naissance: string;

  @ApiProperty({ 
    description: 'Type de pièce d\'identité',
    example: 'Carte d\'identité'
  })
  @IsString()
  @IsNotEmpty()
  type_piece_identite: string;

  @ApiProperty({ 
    description: 'Numéro de la pièce d\'identité',
    example: '1234567890123'
  })
  @IsString()
  @IsNotEmpty()
  numero_piece_identite: string;

  @ApiProperty({ 
    description: 'Adresse email',
    example: 'jean.martin@email.com'
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Numéro de téléphone',
    example: '+221771234567'
  })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty({ 
    description: 'Adresse physique',
    example: '123 Rue de la Paix, Dakar'
  })
  @IsString()
  @IsNotEmpty()
  adresse: string;
}

// DTO pour créer une simulation de devis simplifiée
export class CreateSimulationDevisSimplifieeDto {
  @ApiProperty({ 
    description: 'ID du produit d\'assurance',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  produit_id: string;

  @ApiProperty({ 
    description: 'Critères choisis par l\'utilisateur (ex: capital, âge)',
    example: { capital: 5000000, age: 30 }
  })
  @IsObject()
  @IsNotEmpty()
  criteres_utilisateur: Record<string, any>;

  @ApiProperty({ 
    description: 'L\'assuré est-il le souscripteur lui-même ?',
    example: true,
    default: true
  })
  @IsBoolean()
  assure_est_souscripteur: boolean;

  @ApiProperty({ 
    description: 'Informations de la personne à assurer (si différente du souscripteur)',
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InformationsAssureDto)
  informations_assure?: InformationsAssureDto;

  @ApiProperty({ 
    description: 'Liste des bénéficiaires (si requis par le produit)',
    type: [CreateBeneficiaireDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBeneficiaireDto)
  beneficiaires?: CreateBeneficiaireDto[];
}

// DTO pour la réponse de simulation
export class SimulationDevisSimplifieeResponseDto {
  @ApiProperty({ 
    description: 'ID du devis simulé',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'Nom du produit',
    example: 'Assurance Vie Épargne Plus'
  })
  nom_produit: string;

  @ApiProperty({ 
    description: 'Type du produit',
    example: 'vie'
  })
  type_produit: string;

  @ApiProperty({ 
    description: 'Périodicité de la prime',
    example: 'mensuel'
  })
  periodicite_prime: string;

  @ApiProperty({ 
    description: 'Critères sélectionnés',
    example: { capital: 5000000, tranche_age: '18-30 ans' }
  })
  criteres_utilisateur: Record<string, any>;

  @ApiProperty({ 
    description: 'Prime calculée (tarif fixe)',
    example: 12500.00
  })
  prime_calculee: number;

  @ApiProperty({ 
    description: 'L\'assuré est-il le souscripteur ?',
    example: true
  })
  assure_est_souscripteur: boolean;

  @ApiProperty({ 
    description: 'Informations de l\'assuré (si différent du souscripteur)',
    required: false
  })
  informations_assure?: InformationsAssureDto;

  @ApiProperty({ 
    description: 'Chemin vers la photo recto de l\'assuré (si assuré ≠ souscripteur)',
    required: false,
    example: 'uploads/profiles/assures/devis_123/recto.png'
  })
  front_document_path?: string;

  @ApiProperty({ 
    description: 'Chemin vers la photo verso de l\'assuré (si assuré ≠ souscripteur)',
    required: false,
    example: 'uploads/profiles/assures/devis_123/verso.png'
  })
  back_document_path?: string;

  @ApiProperty({ 
    description: 'Liste des bénéficiaires',
    type: [CreateBeneficiaireDto],
    required: false
  })
  beneficiaires?: CreateBeneficiaireDto[];

  @ApiProperty({ 
    description: 'Date de création',
    example: '2024-01-15T10:30:00.000Z'
  })
  created_at: Date;
}
