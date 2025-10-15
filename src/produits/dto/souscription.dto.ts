import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ValidateNested, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { MethodePaiement } from '../entities/paiement.entity';

// DTO pour les bénéficiaires lors de la souscription
export class BeneficiaireSouscriptionDto {
  @ApiProperty({ 
    description: 'Nom complet du bénéficiaire',
    example: 'Marie Dupont'
  })
  @IsString()
  @IsNotEmpty()
  nom_complet: string;

  @ApiProperty({ 
    description: 'Lien avec le souscripteur',
    example: 'Épouse'
  })
  @IsString()
  @IsNotEmpty()
  lien_souscripteur: string;

  @ApiProperty({ 
    description: 'Ordre de priorité du bénéficiaire',
    example: 1
  })
  @IsNotEmpty()
  ordre: number;
}

// DTO pour la souscription d'un devis
export class SouscrireDevisDto {
  @ApiProperty({ 
    description: 'Méthode de paiement choisie',
    enum: MethodePaiement,
    example: MethodePaiement.WAVE
  })
  @IsEnum(MethodePaiement)
  @IsNotEmpty()
  methode_paiement: MethodePaiement;

  @ApiProperty({ 
    description: 'Numéro de téléphone pour les paiements mobile money',
    example: '+221771234567',
    required: false
  })
  @IsOptional()
  @IsString()
  numero_telephone?: string;

  @ApiProperty({ 
    description: 'Liste des bénéficiaires (requis si le produit nécessite des bénéficiaires)',
    type: [BeneficiaireSouscriptionDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BeneficiaireSouscriptionDto)
  beneficiaires?: BeneficiaireSouscriptionDto[];
}

// DTO de réponse pour la souscription
export class SouscriptionResponseDto {
  @ApiProperty({ 
    description: 'ID du paiement',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  paiement_id: string;

  @ApiProperty({ 
    description: 'Référence du paiement',
    example: 'PAY-1234567890-0001'
  })
  reference_paiement: string;

  @ApiProperty({ 
    description: 'Statut du paiement',
    example: 'en_attente'
  })
  statut_paiement: string;

  @ApiProperty({ 
    description: 'Montant à payer',
    example: 12500.00
  })
  montant: number;

  @ApiProperty({ 
    description: 'Message d\'information',
    example: 'Paiement initié avec succès. En attente de confirmation.'
  })
  message: string;
}

// DTO pour le callback de paiement
export class CallbackPaiementDto {
  @ApiProperty({ 
    description: 'Référence du paiement',
    example: 'PAY-1234567890-0001'
  })
  @IsString()
  @IsNotEmpty()
  reference_paiement: string;

  @ApiProperty({ 
    description: 'Statut du paiement reçu de l\'agrégateur',
    example: 'success'
  })
  @IsString()
  @IsNotEmpty()
  statut: string;

  @ApiProperty({ 
    description: 'Référence externe de l\'agrégateur',
    example: 'WAVE-12345',
    required: false
  })
  @IsOptional()
  @IsString()
  reference_externe?: string;

  @ApiProperty({ 
    description: 'Message d\'erreur (si échec)',
    required: false
  })
  @IsOptional()
  @IsString()
  message_erreur?: string;

  @ApiProperty({ 
    description: 'Données additionnelles du callback',
    required: false
  })
  @IsOptional()
  donnees_supplementaires?: Record<string, any>;
}

