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
