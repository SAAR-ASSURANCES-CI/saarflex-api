import { ApiProperty } from '@nestjs/swagger';
import { TypeCritere } from '../entities/critere-tarification.entity';

export class ValeurCriterePublicDto {
  @ApiProperty({ description: 'ID unique de la valeur' })
  id: string;

  @ApiProperty({ description: 'Valeur du critère (pour type catégoriel ou booléen)' })
  valeur?: string;

  @ApiProperty({ description: 'Valeur minimale (pour type numérique)' })
  valeur_min?: number;

  @ApiProperty({ description: 'Valeur maximale (pour type numérique)' })
  valeur_max?: number;

  @ApiProperty({ description: 'Ordre d\'affichage de la valeur' })
  ordre: number;
}

export class CritereTarificationPublicDto {
  @ApiProperty({ description: 'ID unique du critère' })
  id: string;

  @ApiProperty({ description: 'Nom du critère' })
  nom: string;

  @ApiProperty({ 
    enum: TypeCritere, 
    description: 'Type du critère (numérique, catégoriel ou booléen)' 
  })
  type: TypeCritere;

  @ApiProperty({ description: 'Unité de mesure (pour type numérique)' })
  unite?: string;

  @ApiProperty({ description: 'Ordre d\'affichage du critère' })
  ordre: number;

  @ApiProperty({ description: 'Indique si le critère est obligatoire' })
  obligatoire: boolean;

  @ApiProperty({ 
    description: 'Valeurs possibles pour ce critère',
    type: [ValeurCriterePublicDto]
  })
  valeurs: ValeurCriterePublicDto[];

  @ApiProperty({ description: 'Nombre de valeurs associées' })
  nombre_valeurs: number;
}

export class CriteresPublicResponseDto {
  @ApiProperty({ type: [CritereTarificationPublicDto] })
  criteres: CritereTarificationPublicDto[];

  @ApiProperty({ description: 'Nombre total de critères' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre d\'éléments par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  total_pages: number;
}
