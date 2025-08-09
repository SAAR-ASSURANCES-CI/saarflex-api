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

  @ApiProperty({ required: false, nullable: true })
  numero_piece_identite?: string | null;

  @ApiProperty({ required: false, nullable: true })
  type_piece_identite?: string | null;

  @ApiProperty()
  date_creation: Date;

  @ApiProperty()
  date_modification: Date;
}


