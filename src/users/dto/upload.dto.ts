import { ApiProperty } from '@nestjs/swagger';

export class UploadImagesResponseDto {
  @ApiProperty({
    description: 'Chemin du fichier recto de la carte d\'identité',
    example: 'uploads/profiles/alikson_awouatsa/recto.png'
  })
  recto_path: string;

  @ApiProperty({
    description: 'Chemin du fichier verso de la carte d\'identité',
    example: 'uploads/profiles/alikson_awouatsa/verso.png'
  })
  verso_path: string;
}

export class UploadErrorResponseDto {
  @ApiProperty({
    description: 'Message d\'erreur',
    example: 'Format de fichier non supporté'
  })
  message: string;

  @ApiProperty({
    description: 'Code d\'erreur',
    example: 'INVALID_FILE_FORMAT'
  })
  error: string;

  @ApiProperty({
    description: 'Code de statut HTTP',
    example: 400
  })
  statusCode: number;
}
