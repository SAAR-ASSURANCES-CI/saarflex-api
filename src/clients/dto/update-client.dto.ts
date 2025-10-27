import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * DTO pour la mise à jour des informations d'un client
 */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nom?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  telephone?: string;
}

