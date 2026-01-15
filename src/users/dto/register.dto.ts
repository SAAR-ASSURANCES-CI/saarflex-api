import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    Matches
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../entities/user.entity';

export class RegisterDto {
    @ApiProperty({
        description: 'Nom complet de l\'utilisateur',
        example: 'Jean Dupont',
    })
    @IsNotEmpty({ message: 'Le nom est obligatoire' })
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    nom: string;

    @ApiProperty({
        description: 'Adresse email unique',
        example: 'jean.dupont@example.com',
    })
    @IsEmail({}, { message: 'Format d\'email invalide' })
    @IsNotEmpty({ message: 'L\'email est obligatoire' })
    email: string;

    @ApiProperty({
        description: 'Numéro de téléphone',
        example: '+225 01 02 03 04 05',
        required: false,
    })
    @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
    @Matches(/^\+?\d{1,3}[\s.-]?\d{1,14}$/, { message: 'Le numéro de téléphone doit être valide et contenir uniquement des chiffres.' })
    @IsOptional()
    telephone?: string | null;

    @ApiProperty({
        description: 'Mot de passe (minimum 8 caractères)',
        example: 'MotDePasse123!',
        minLength: 8,
    })
    @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    })
    mot_de_passe: string;

    @ApiProperty({
        description: 'Type d\'utilisateur',
        enum: UserType,
        example: UserType.CLIENT,
        required: false,
    })
    @IsOptional()
    @IsEnum(UserType, {
        message: 'Type d\'utilisateur invalide. Valeurs acceptées: client, agent, drh, admin',
    })
    type_utilisateur?: UserType;
}

export class RegisterResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    nom: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    telephone?: string;

    @ApiProperty({ enum: UserType })
    type_utilisateur: UserType;

    @ApiProperty()
    statut: boolean;

    @ApiProperty()
    date_creation: Date;

    @ApiProperty({ required: false, nullable: true })
    avatar_url?: string | null;

    @ApiProperty({
        description: 'Token JWT pour l\'authentification',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    token: string;

    @ApiProperty({
        description: 'Type de token',
        example: 'Bearer'
    })
    token_type: string;

    @ApiProperty({
        description: 'Durée de validité du token en secondes',
        example: 86400
    })
    expires_in: number;
}