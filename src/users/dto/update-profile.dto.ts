import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nom et prénom complets', minLength: 2, maxLength: 255, example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  nom?: string;

  @ApiPropertyOptional({ description: 'Lieu de naissance', example: 'Dakar' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  lieu_naissance?: string | null;

  @ApiPropertyOptional({ description: 'Sexe', example: 'masculin' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  sexe?: string | null;

  @ApiPropertyOptional({ description: 'Nationalité', example: 'Sénégalaise' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationalite?: string | null;

  @ApiPropertyOptional({ description: 'Profession', example: 'Développeur' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  profession?: string | null;

  @ApiPropertyOptional({ description: 'Numéro de téléphone', minLength: 8, maxLength: 20, example: '+221771234567' })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  telephone?: string | null;

  @ApiPropertyOptional({ description: 'Adresse email', example: 'jean.dupont@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Adresse de résidence', example: '123 Rue Principale, Dakar' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  adresse?: string | null;

  @ApiPropertyOptional({ description: 'Date de naissance (format DD-MM-YYYY)', example: '20-05-1990' })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{4}$/,
    { message: 'La date de naissance doit être au format DD-MM-YYYY' })
  date_naissance?: string | null;

  @ApiPropertyOptional({ description: "Numéro de pièce d'identité", example: 'CNI123456789' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  numero_piece_identite?: string | null;

  @ApiPropertyOptional({ description: "Type de pièce d'identité", example: 'CNI' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  type_piece_identite?: string | null;
}


