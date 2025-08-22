import { ApiProperty } from '@nestjs/swagger';
import { TypeProduit, StatutProduit } from '../entities/produit.entity';
import { BrancheProduitDto } from './branche-produit.dto';

export class ProduitDto {
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

  @ApiProperty({ description: 'Branche du produit' })
  branche: BrancheProduitDto;
}

export class ProduitQueryDto {
  @ApiProperty({ 
    required: false, 
    enum: TypeProduit, 
    description: 'Filtrer par type de produit' 
  })
  type?: TypeProduit;

  @ApiProperty({ 
    required: false, 
    description: 'Filtrer par branche (ID)' 
  })
  branche_id?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Recherche textuelle dans le nom et description' 
  })
  search?: string;

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

  @ApiProperty({ 
    required: false, 
    default: 'created_at', 
    description: 'Champ de tri' 
  })
  sort_by?: string = 'created_at';

  @ApiProperty({ 
    required: false, 
    enum: ['ASC', 'DESC'], 
    default: 'DESC', 
    description: 'Ordre de tri' 
  })
  sort_order?: 'ASC' | 'DESC' = 'DESC';
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
