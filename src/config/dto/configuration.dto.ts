import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

/**
 * DTO pour mettre à jour le code agence
 */
export class UpdateCodeAgenceDto {
    @ApiProperty({
        description: 'Code agence/intermédiaire (3 chiffres)',
        example: '101',
        pattern: '^\\d{3}$',
    })
    @IsString()
    @Length(3, 3, { message: 'Le code agence doit faire exactement 3 caractères' })
    @Matches(/^\d{3}$/, { message: 'Le code agence doit être composé de 3 chiffres' })
    code_agence: string;
}
