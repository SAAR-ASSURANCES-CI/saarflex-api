import { ApiProperty } from '@nestjs/swagger';

export class BrancheProduitDto {
  @ApiProperty({ description: 'ID unique de la branche' })
  id: string;

  @ApiProperty({ description: 'Nom de la branche' })
  nom: string;

  @ApiProperty({ description: 'Description de la branche' })
  description: string;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  ordre: number;
}

export class BrancheProduitNullableDto {
  @ApiProperty({ description: 'ID unique de la branche', required: false })
  id?: string;

  @ApiProperty({ description: 'Nom de la branche', required: false })
  nom?: string;

  @ApiProperty({ description: 'Description de la branche', required: false })
  description?: string;

  @ApiProperty({ description: 'Ordre d\'affichage', required: false })
  ordre?: number;
}
