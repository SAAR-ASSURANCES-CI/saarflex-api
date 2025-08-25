import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsString, IsDecimal } from 'class-validator';

export class CreateTarifDto {
  @ApiProperty({ description: 'ID de la grille tarifaire' })
  @IsUUID()
  grille_id: string;

  @ApiProperty({ description: 'ID du critère de tarification', required: false })
  @IsOptional()
  @IsUUID()
  critere_id?: string;

  @ApiProperty({ description: 'ID de la valeur du critère', required: false })
  @IsOptional()
  @IsUUID()
  valeur_critere_id?: string;

  @ApiProperty({ description: 'Montant du tarif', required: false })
  @IsOptional()
  @IsNumber()
  montant?: number;

  @ApiProperty({ description: 'Pourcentage du tarif', required: false })
  @IsOptional()
  @IsNumber()
  pourcentage?: number;

  @ApiProperty({ description: 'Formule de calcul', required: false })
  @IsOptional()
  @IsString()
  formule?: string;
}

export class UpdateTarifDto {
  @ApiProperty({ description: 'ID de la grille tarifaire', required: false })
  @IsOptional()
  @IsUUID()
  grille_id?: string;

  @ApiProperty({ description: 'ID du critère de tarification', required: false })
  @IsOptional()
  @IsUUID()
  critere_id?: string;

  @ApiProperty({ description: 'ID de la valeur du critère', required: false })
  @IsOptional()
  @IsUUID()
  valeur_critere_id?: string;

  @ApiProperty({ description: 'Montant du tarif', required: false })
  @IsOptional()
  @IsNumber()
  montant?: number;

  @ApiProperty({ description: 'Pourcentage du tarif', required: false })
  @IsOptional()
  @IsNumber()
  pourcentage?: number;

  @ApiProperty({ description: 'Formule de calcul', required: false })
  @IsOptional()
  @IsString()
  formule?: string;
}

export class TarifDto {
  @ApiProperty({ description: 'ID unique du tarif' })
  id: string;

  @ApiProperty({ description: 'ID de la grille tarifaire' })
  grille_id: string;

  @ApiProperty({ description: 'ID du critère de tarification', required: false })
  critere_id?: string;

  @ApiProperty({ description: 'ID de la valeur du critère', required: false })
  valeur_critere_id?: string;

  @ApiProperty({ description: 'Montant du tarif', required: false })
  montant?: number;

  @ApiProperty({ description: 'Pourcentage du tarif', required: false })
  pourcentage?: number;

  @ApiProperty({ description: 'Formule de calcul', required: false })
  formule?: string;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;
}

export class TarifWithGrilleDto extends TarifDto {
  @ApiProperty({ description: 'Grille tarifaire associée' })
  grilleTarifaire: {
    id: string;
    nom: string;
    statut: string;
    produit: {
      id: string;
      nom: string;
      type: string;
      branche: {
        id: string;
        nom: string;
        type: string;
      };
    };
  };
}

export class TarifsResponseDto {
  @ApiProperty({ description: 'Liste des tarifs' })
  tarifs: TarifDto[];

  @ApiProperty({ description: 'Nombre total de tarifs' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Taille de la page' })
  limit: number;
}

export class TarifsWithGrilleResponseDto {
  @ApiProperty({ description: 'Liste des tarifs avec grilles' })
  tarifs: TarifWithGrilleDto[];

  @ApiProperty({ description: 'Nombre total de tarifs' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Taille de la page' })
  limit: number;
}

export class CalculPrimeResponseDto {
  @ApiProperty({ description: 'Tarif utilisé pour le calcul' })
  tarif: TarifDto;

  @ApiProperty({ description: 'Prime calculée' })
  prime_calculee: number;

  @ApiProperty({ description: 'Montant utilisé dans le calcul', required: false })
  montant_calcule?: number;

  @ApiProperty({ description: 'Pourcentage utilisé dans le calcul', required: false })
  pourcentage_calcule?: number;

  @ApiProperty({ description: 'Formule utilisée pour le calcul', required: false })
  formule_utilisee?: string;
}
