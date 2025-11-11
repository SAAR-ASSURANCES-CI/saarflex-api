import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutPaiement, MethodePaiement } from '../entities/paiement.entity';

export class PaiementsListQueryDto {
  @ApiProperty({ description: 'Statut du paiement', enum: StatutPaiement, required: false })
  @IsOptional()
  @IsEnum(StatutPaiement)
  statut?: StatutPaiement;

  @ApiProperty({ description: 'Méthode de paiement', enum: MethodePaiement, required: false })
  @IsOptional()
  @IsEnum(MethodePaiement)
  methode?: MethodePaiement;

  @ApiProperty({ description: 'Référence du paiement', required: false })
  @IsOptional()
  @IsString()
  reference_paiement?: string;

  @ApiProperty({ description: 'Transaction externe', required: false })
  @IsOptional()
  @IsString()
  reference_externe?: string;

  @ApiProperty({ description: 'ID utilisateur', required: false })
  @IsOptional()
  @IsUUID()
  utilisateur_id?: string;

  @ApiProperty({ description: 'ID du devis', required: false })
  @IsOptional()
  @IsUUID()
  devis_id?: string;

  @ApiProperty({ description: 'Montant minimum', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  montant_min?: number;

  @ApiProperty({ description: 'Montant maximum', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  montant_max?: number;

  @ApiProperty({ description: 'Page', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Limite', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class PaiementAdminDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference_paiement: string;

  @ApiProperty()
  montant: number;

  @ApiProperty({ enum: MethodePaiement })
  methode_paiement: MethodePaiement;

  @ApiProperty({ enum: StatutPaiement })
  statut: StatutPaiement;

  @ApiProperty({ required: false })
  reference_externe?: string;

  @ApiProperty({ required: false })
  numero_telephone?: string;

  @ApiProperty({ required: false })
  currency?: string;

  @ApiProperty({ required: false })
  date_paiement?: Date | null;

  @ApiProperty({ required: false })
  cinetpay_transaction_id?: string;

  @ApiProperty({ required: false })
  operator_id?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ required: false })
  updated_at?: Date;

  @ApiProperty({ required: false })
  utilisateur?: {
    id: string;
    nom: string;
    email: string;
    telephone?: string;
  };

  @ApiProperty({ required: false })
  devis?: {
    id: string;
    reference: string;
    produit_nom: string;
  };

}

export class PaiementsListResponseDto {
  @ApiProperty({ type: [PaiementAdminDto] })
  data: PaiementAdminDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

