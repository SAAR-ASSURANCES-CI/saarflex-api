import {
    IsNotEmpty,
    IsString,
    MinLength,
    Matches
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordFirstLoginDto {
    @ApiProperty({
        description: 'Mot de passe actuel (temporaire)',
        example: 'TempPass123!',
    })
    @IsNotEmpty({ message: 'Le mot de passe actuel est obligatoire' })
    @IsString({ message: 'Le mot de passe actuel doit être une chaîne de caractères' })
    mot_de_passe_actuel: string;

    @ApiProperty({
        description: 'Nouveau mot de passe (minimum 8 caractères)',
        example: 'NouveauMotDePasse123!',
        minLength: 8,
    })
    @IsNotEmpty({ message: 'Le nouveau mot de passe est obligatoire' })
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    })
    nouveau_mot_de_passe: string;
}

