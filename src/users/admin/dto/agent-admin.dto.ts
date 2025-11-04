import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    IsEnum
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../entities/user.entity';

export class CreateAgentDto {
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
        description: 'Type d\'utilisateur (admin ou agent)',
        example: 'agent',
        enum: UserType,
        enumName: 'UserType',
    })
    @IsNotEmpty({ message: 'Le type d\'utilisateur est obligatoire' })
    @IsEnum(UserType, { message: 'Le type d\'utilisateur doit être admin ou agent' })
    type_utilisateur: UserType;
}

export class UpdateAgentDto {
    @ApiProperty({
        description: 'Nom complet de l\'agent',
        example: 'Jean Dupont',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Le nom doit être une chaîne de caractères' })
    nom?: string;

    @ApiProperty({
        description: 'Adresse email unique',
        example: 'jean.dupont@example.com',
        required: false,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Format d\'email invalide' })
    email?: string;

    @ApiProperty({
        description: 'Numéro de téléphone',
        example: '+225 01 02 03 04 05',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
    @Matches(/^\+?\d{1,3}[\s.-]?\d{1,14}$/, { message: 'Le numéro de téléphone doit être valide et contenir uniquement des chiffres.' })
    telephone?: string | null;
}

export class AgentResponseDto {
    @ApiProperty({ description: 'ID unique de l\'utilisateur' })
    id: string;

    @ApiProperty({ description: 'Nom complet de l\'utilisateur' })
    nom: string;

    @ApiProperty({ description: 'Email de l\'utilisateur' })
    email: string;

    @ApiProperty({ description: 'Téléphone de l\'utilisateur', required: false })
    telephone?: string | null;

    @ApiProperty({ description: 'Type d\'utilisateur', enum: UserType })
    type_utilisateur: UserType;

    @ApiProperty({ description: 'Statut du compte (actif/suspendu)' })
    statut: boolean;

    @ApiProperty({ description: 'Première connexion requise' })
    premiere_connexion: boolean;

    @ApiProperty({ description: 'Date de création' })
    date_creation: Date;

    @ApiProperty({ description: 'Date de dernière modification' })
    date_modification: Date;

    @ApiProperty({ description: 'Date de dernière connexion', required: false })
    derniere_connexion?: Date | null;
}

export class AgentsResponseDto {
    @ApiProperty({ description: 'Liste des utilisateurs', type: [AgentResponseDto] })
    agents: AgentResponseDto[];

    @ApiProperty({ description: 'Nombre total d\'utilisateurs' })
    total: number;

    @ApiProperty({ description: 'Page actuelle' })
    page: number;

    @ApiProperty({ description: 'Taille de la page' })
    limit: number;

    @ApiProperty({ description: 'Nombre total de pages' })
    total_pages: number;
}

