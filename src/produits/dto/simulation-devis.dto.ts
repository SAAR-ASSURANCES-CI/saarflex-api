import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsObject, IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { StatutDevis } from '../entities/devis-simule.entity';

export class SimulationDevisDto {
  @ApiProperty({ description: 'ID du produit à simuler' })
  @IsUUID()
  produit_id: string;

  @ApiProperty({ description: 'ID de la grille tarifaire à utiliser' })
  @IsUUID()
  grille_tarifaire_id: string;

  @ApiProperty({ 
    description: 'Critères de l\'utilisateur pour la simulation',
    example: {
      age: 30,
      profession: 'employé',
      montant_assurance: 50000,
      zone_geographique: 'zone1'
    }
  })
  @IsObject()
  criteres_utilisateur: Record<string, any>;
}

export class SimulationResponseDto {
  @ApiProperty({ description: 'ID du devis simulé' })
  id: string;

  @ApiProperty({ description: 'Prime calculée' })
  prime_calculee: number;

  @ApiProperty({ description: 'Franchise calculée' })
  franchise_calculee: number;

  @ApiProperty({ description: 'Plafond calculé', required: false })
  plafond_calcule?: number;

  @ApiProperty({ description: 'Détails du calcul' })
  details_calcul: {
    formule_utilisee: string;
    variables_calculees: Record<string, any>;
    explication: string;
  };

  @ApiProperty({ description: 'Statut du devis' })
  statut: StatutDevis;

  @ApiProperty({ description: 'Date d\'expiration' })
  expires_at: Date | null;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;
}

export class SauvegardeDevisDto {
  @ApiProperty({ description: 'ID du devis simulé à sauvegarder' })
  @IsUUID()
  devis_id: string;

  @ApiProperty({ description: 'Nom personnalisé pour le devis', required: false })
  @IsOptional()
  @IsString()
  nom_personnalise?: string;

  @ApiProperty({ description: 'Notes personnelles', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DevisSauvegardeDto {
  @ApiProperty({ description: 'ID du devis' })
  id: string;

  @ApiProperty({ description: 'Nom du produit' })
  nom_produit: string;

  @ApiProperty({ description: 'Type du produit' })
  type_produit: string;

  @ApiProperty({ description: 'Prime calculée' })
  prime_calculee: number;

  @ApiProperty({ description: 'Franchise calculée' })
  franchise_calculee: number;

  @ApiProperty({ description: 'Plafond calculé', required: false })
  plafond_calcule?: number;

  @ApiProperty({ description: 'Critères utilisateur' })
  criteres_utilisateur: Record<string, any>;

  @ApiProperty({ description: 'Statut du devis' })
  statut: StatutDevis;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Nom personnalisé', required: false })
  nom_personnalise?: string | null;

  @ApiProperty({ description: 'Notes personnelles', required: false })
  notes?: string | null;
}
