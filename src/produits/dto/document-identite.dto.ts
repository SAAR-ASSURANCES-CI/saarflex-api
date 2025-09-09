import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsEnum, IsInt, Min } from 'class-validator';
import { TypeDocument } from '../entities/document-identite.entity';

export class CreateDocumentIdentiteDto {
  @ApiProperty({ 
    description: 'Nom du fichier',
    example: 'cni_recto_jean_dupont.jpg',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom_fichier: string;

  @ApiProperty({ 
    description: 'Chemin vers le fichier stocké',
    example: '/uploads/documents/cni_recto_jean_dupont.jpg',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  chemin_fichier: string;

  @ApiProperty({ 
    enum: TypeDocument,
    description: 'Type de document (recto ou verso)',
    example: TypeDocument.RECTO
  })
  @IsEnum(TypeDocument)
  type_document: TypeDocument;

  @ApiProperty({ 
    description: 'Type MIME du fichier',
    example: 'image/jpeg',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type_mime: string;

  @ApiProperty({ 
    description: 'Taille du fichier en bytes',
    example: 1024000,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  taille_fichier: number;
}

export class DocumentIdentiteDto extends CreateDocumentIdentiteDto {
  @ApiProperty({ 
    description: 'ID unique du document',
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
