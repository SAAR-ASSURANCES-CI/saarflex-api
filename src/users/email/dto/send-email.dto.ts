import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
    @ApiProperty({
        description: 'Adresse(s) email du ou des destinataires (chaîne séparée par des virgules ou tableau)',
        example: 'client@example.com, autre@example.com'
    })
    @IsNotEmpty({ message: 'L\'email du destinataire est requis' })
    to: string | string[];

    @ApiProperty({
        description: 'Sujet de l\'email',
        example: 'Information sur votre contrat'
    })
    @IsString()
    @IsNotEmpty({ message: 'Le sujet est requis' })
    subject: string;

    @ApiProperty({
        description: 'Contenu HTML de l\'email',
        example: '<p>Bonjour, voici les informations...</p>'
    })
    @IsString()
    @IsNotEmpty({ message: 'Le contenu du message est requis' })
    message: string;
}
