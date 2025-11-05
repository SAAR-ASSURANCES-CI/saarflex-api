import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsObject, IsBoolean } from 'class-validator';

/**
 * DTO pour l'initialisation d'un paiement CinetPay
 */
export class InitierPaiementCinetPayDto {
  @ApiProperty({ description: 'Identifiant unique de la transaction' })
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty({ description: 'Montant de la transaction (multiple de 5)' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Devise (XOF, XAF)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Description du paiement' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URL de notification' })
  @IsString()
  @IsNotEmpty()
  notify_url: string;

  @ApiProperty({ description: 'URL de retour' })
  @IsString()
  @IsNotEmpty()
  return_url: string;

  @ApiProperty({ description: 'Channels de paiement (MOBILE_MONEY, WALLET)' })
  @IsString()
  @IsNotEmpty()
  channels: string;

  @ApiProperty({ description: 'Langue du guichet (fr, en)', required: false })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiProperty({ description: 'Métadonnées supplémentaires', required: false })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiProperty({ description: 'Données pour la facture', required: false })
  @IsOptional()
  @IsObject()
  invoice_data?: Record<string, string>;

  @ApiProperty({ description: 'Verrouiller le numéro de téléphone', required: false })
  @IsOptional()
  @IsBoolean()
  lock_phone_number?: boolean;

  @ApiProperty({ description: 'Numéro de téléphone du client', required: false })
  @IsOptional()
  @IsString()
  customer_phone_number?: string;

  // Informations client pour carte bancaire (optionnel)
  @ApiProperty({ description: 'ID client', required: false })
  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiProperty({ description: 'Nom du client', required: false })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiProperty({ description: 'Prénom du client', required: false })
  @IsOptional()
  @IsString()
  customer_surname?: string;

  @ApiProperty({ description: 'Email du client', required: false })
  @IsOptional()
  @IsString()
  customer_email?: string;

  @ApiProperty({ description: 'Adresse du client', required: false })
  @IsOptional()
  @IsString()
  customer_address?: string;

  @ApiProperty({ description: 'Ville du client', required: false })
  @IsOptional()
  @IsString()
  customer_city?: string;

  @ApiProperty({ description: 'Pays du client (code ISO 2 lettres)', required: false })
  @IsOptional()
  @IsString()
  customer_country?: string;

  @ApiProperty({ description: 'État du client', required: false })
  @IsOptional()
  @IsString()
  customer_state?: string;

  @ApiProperty({ description: 'Code postal du client', required: false })
  @IsOptional()
  @IsString()
  customer_zip_code?: string;
}

/**
 * DTO pour la réponse d'initialisation CinetPay
 */
export class CinetPayInitResponseDto {
  @ApiProperty({ description: 'Code de statut' })
  code: string;

  @ApiProperty({ description: 'Message' })
  message: string;

  @ApiProperty({ description: 'Données de la réponse', required: false })
  data?: {
    payment_token?: string;
    payment_url?: string;
    transaction_id?: string;
    operator_id?: string;
  };
}

/**
 * DTO pour le callback CinetPay
 */
export class CinetPayCallbackDto {
  @ApiProperty({ description: 'Identifiant de la transaction' })
  transaction_id?: string;

  @ApiProperty({ description: 'Statut de la transaction' })
  status?: string;

  @ApiProperty({ description: 'Code de statut' })
  code?: string;

  @ApiProperty({ description: 'Message' })
  message?: string;

  @ApiProperty({ description: 'Opérateur utilisé', required: false })
  operator_id?: string;

  @ApiProperty({ description: 'Métadonnées', required: false })
  metadata?: string;
}

