import { ApiProperty } from '@nestjs/swagger';
import { TypeProduit, StatutProduit, PeriodicitePrime } from '../entities/produit.entity';
import { BrancheProduitDto, BrancheProduitNullableDto } from './branche-produit.dto';

export class ProduitDto {
  @ApiProperty({ description: 'ID unique du produit' })
  id: string;

  @ApiProperty({ description: 'Nom du produit' })
  nom: string;

  @ApiProperty({ description: 'Icône du produit' })
  icon: string;

  @ApiProperty({ description: 'URL de l\'icône SVG du produit' })
  icon_url: string;

  @ApiProperty({
    enum: TypeProduit,
    description: 'Type du produit (vie ou non-vie)'
  })
  type: TypeProduit;

  @ApiProperty({ description: 'Description détaillée du produit' })
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

  @ApiProperty({
    description: 'Le produit nécessite-t-il des bénéficiaires ?',
    example: true
  })
  necessite_beneficiaires: boolean;

  @ApiProperty({
    description: 'Nombre maximum de bénéficiaires autorisés',
    example: 2
  })
  max_beneficiaires: number;

  @ApiProperty({
    description: 'Le produit nécessite-t-il les informations du véhicule ?',
    example: false
  })
  necessite_informations_vehicule: boolean;

  @ApiProperty({
    enum: PeriodicitePrime,
    description: 'Périodicité de paiement de la prime',
    example: PeriodicitePrime.MENSUEL
  })
  periodicite_prime: PeriodicitePrime;

  @ApiProperty({ description: 'Branche du produit', required: false })
  branche: BrancheProduitNullableDto | null;
}

export class PaginationQueryDto {
  @ApiProperty({
    required: false,
    default: 1,
    description: 'Numéro de page'
  })
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Nombre d\'éléments par page'
  })
  limit?: number = 10;
}

export class ProduitsResponseDto {
  @ApiProperty({ type: [ProduitDto] })
  produits: ProduitDto[];

  @ApiProperty({ description: 'Nombre total de produits' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  total_pages: number;
}
