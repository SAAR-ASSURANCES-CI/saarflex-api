import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../entities/user.entity';

export class ProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  telephone?: string | null;

  @ApiProperty({ enum: UserType })
  type_utilisateur: UserType;

  @ApiProperty()
  statut: boolean;

  @ApiProperty({ required: false, nullable: true })
  lieu_naissance?: string | null;

  @ApiProperty({ required: false, nullable: true })
  sexe?: string | null;

  @ApiProperty({ required: false, nullable: true })
  nationalite?: string | null;

  @ApiProperty({ required: false, nullable: true })
  profession?: string | null;

  @ApiProperty({ required: false, nullable: true })
  adresse?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Date de naissance (format DD-MM-YYYY)' })
  date_naissance?: string | null;

  @ApiProperty({ required: false, nullable: true })
  numero_piece_identite?: string | null;

  @ApiProperty({ required: false, nullable: true })
  type_piece_identite?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Date d\'expiration de la pièce d\'identité (format DD-MM-YYYY)' })
  date_expiration_piece_identite?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Chemin vers la photo recto de la carte d\'identité' })
  front_document_path?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Chemin vers la photo verso de la carte d\'identité' })
  back_document_path?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Chemin vers l\'avatar' })
  avatar_path?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'URL de l\'avatar' })
  avatar_url?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'URL de la photo recto de la carte d\'identité' })
  front_document_url?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'URL de la photo verso de la carte d\'identité' })
  back_document_url?: string | null;

  @ApiProperty()
  date_creation: Date;

  @ApiProperty()
  date_modification: Date;
}


