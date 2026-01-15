import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserType } from '../entities/user.entity';

export class LoginDto {
  @ApiProperty({ description: "Adresse email de l'utilisateur", example: 'jean.dupont@example.com' })
  @IsEmail({}, { message: "Format d'email invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @ApiProperty({ description: 'Mot de passe', example: 'MotDePasse123!' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  mot_de_passe: string;
}

export class LoginResponseDto {
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

  @ApiProperty()
  date_creation: Date;

  @ApiProperty({ required: false, nullable: true })
  avatar_url?: string | null;

  @ApiProperty({ description: "Token JWT pour l'authentification" })
  token: string;

  @ApiProperty({ description: 'Type de token', example: 'Bearer' })
  token_type: string;

  @ApiProperty({ description: 'Durée de validité du token en secondes', example: 86400 })
  expires_in: number;

  @ApiProperty({ description: 'Première connexion requise', required: false })
  premiere_connexion?: boolean;

  @ApiProperty({ description: 'Le mot de passe doit être changé', required: false })
  must_change_password?: boolean;
}


