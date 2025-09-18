import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsInt, Min, Max } from 'class-validator';

export class CreateBeneficiaireDto {
  @ApiProperty({ 
    description: 'Nom complet du bénéficiaire',
    example: 'Marie Dupont',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom_complet: string;

  @ApiProperty({ 
    description: 'Lien avec le souscripteur',
    example: 'Épouse',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lien_souscripteur: string;

  @ApiProperty({ 
    description: 'Ordre du bénéficiaire (1er, 2ème)',
    example: 1,
    minimum: 1,
    maximum: 2
  })
  @IsInt()
  @Min(1)
  @Max(2)
  ordre: number;
}

export class BeneficiaireDto extends CreateBeneficiaireDto {
  @ApiProperty({ 
    description: 'ID unique du bénéficiaire',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ 
    description: 'ID du devis simulé',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  devis_simule_id: string;

  @ApiProperty({ 
    description: 'Date de création',
    example: '2024-01-15T10:30:00.000Z'
  })
  created_at: Date;
}
