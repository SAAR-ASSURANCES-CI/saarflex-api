import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, IsString, IsEnum, ValidateIf, Min, Max } from 'class-validator';
import { TypeCalculTarif } from '../entities/tarif.entity';

export class CreateTarifDto {
  @ApiProperty({ description: 'ID de la grille tarifaire' })
  @IsUUID()
  grille_id: string;

  @ApiProperty({
    description: 'Type de calcul du tarif',
    enum: TypeCalculTarif,
    default: TypeCalculTarif.MONTANT_FIXE
  })
  @IsOptional()
  @IsEnum(TypeCalculTarif)
  type_calcul?: TypeCalculTarif;

  @ApiProperty({
    description: 'Montant fixe du tarif (requis si type_calcul = montant_fixe)',
    required: false
  })
  @ValidateIf(o => o.type_calcul === TypeCalculTarif.MONTANT_FIXE || !o.type_calcul)
  @IsNumber()
  @Min(0)
  montant_fixe?: number;

  @ApiProperty({
    description: 'Taux de pourcentage (requis si type_calcul = pourcentage_valeur_neuve ou pourcentage_valeur_venale)',
    required: false,
    example: 3.5
  })
  @ValidateIf(o =>
    o.type_calcul === TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE ||
    o.type_calcul === TypeCalculTarif.POURCENTAGE_VALEUR_VENALE
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  taux_pourcentage?: number;

  @ApiProperty({
    description: 'Formule de calcul personnalisée (requis si type_calcul = formule_personnalisee)',
    required: false,
    example: 'montant_base + (valeur_neuve * 0.01)'
  })
  @ValidateIf(o => o.type_calcul === TypeCalculTarif.FORMULE_PERSONNALISEE)
  @IsString()
  formule_calcul?: string;

  @ApiProperty({ description: 'ID du critère de tarification', required: false })
  @IsOptional()
  @IsUUID()
  critere_id?: string;

  @ApiProperty({ description: 'ID de la valeur du critère', required: false })
  @IsOptional()
  @IsUUID()
  valeur_critere_id?: string;

  @ApiProperty({
    description: 'Critères combinés pour le tarif (pour les produits multi-critères)',
    example: { "Garantie": "Tous Risques", "Type de véhicule": "Promenade et affaires" },
    required: false
  })
  @IsOptional()
  criteres_combines?: Record<string, string>;
}

export class UpdateTarifDto {
  @ApiProperty({ description: 'ID de la grille tarifaire', required: false })
  @IsOptional()
  @IsUUID()
  grille_id?: string;

  @ApiProperty({
    description: 'Type de calcul du tarif',
    enum: TypeCalculTarif,
    required: false
  })
  @IsOptional()
  @IsEnum(TypeCalculTarif)
  type_calcul?: TypeCalculTarif;

  @ApiProperty({
    description: 'Montant fixe du tarif',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montant_fixe?: number;

  @ApiProperty({
    description: 'Taux de pourcentage',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taux_pourcentage?: number;

  @ApiProperty({
    description: 'Formule de calcul personnalisée',
    required: false
  })
  @IsOptional()
  @IsString()
  formule_calcul?: string;

  @ApiProperty({ description: 'ID du critère de tarification', required: false })
  @IsOptional()
  @IsUUID()
  critere_id?: string;

  @ApiProperty({ description: 'ID de la valeur du critère', required: false })
  @IsOptional()
  @IsUUID()
  valeur_critere_id?: string;

  @ApiProperty({
    description: 'Critères combinés pour le tarif (pour les produits multi-critères)',
    required: false
  })
  @IsOptional()
  criteres_combines?: Record<string, string>;
}

export class TarifDto {
  @ApiProperty({ description: 'ID unique du tarif' })
  id: string;

  @ApiProperty({ description: 'ID de la grille tarifaire' })
  grille_id: string;

  @ApiProperty({
    description: 'Type de calcul du tarif',
    enum: TypeCalculTarif
  })
  type_calcul: TypeCalculTarif;

  @ApiProperty({ description: 'Montant fixe du tarif', required: false })
  montant_fixe?: number;

  @ApiProperty({ description: 'Taux de pourcentage', required: false })
  taux_pourcentage?: number;

  @ApiProperty({ description: 'Formule de calcul personnalisée', required: false })
  formule_calcul?: string;

  @ApiProperty({ description: 'ID du critère de tarification', required: false })
  critere_id?: string;

  @ApiProperty({ description: 'ID de la valeur du critère', required: false })
  valeur_critere_id?: string;

  @ApiProperty({
    description: 'Critères combinés pour le tarif',
    required: false
  })
  criteres_combines?: Record<string, string>;

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
