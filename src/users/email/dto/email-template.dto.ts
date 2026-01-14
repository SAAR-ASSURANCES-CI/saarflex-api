import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmailTemplateDto {
    @ApiProperty({ example: 'Relance Paiement', description: 'Nom unique du modèle' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'Action requise : Paiement de votre prime', description: 'Sujet du mail' })
    @IsNotEmpty()
    @IsString()
    subject: string;

    @ApiProperty({ example: '<p>Bonjour {{nom}}, ...</p>', description: 'Contenu HTML du mail' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateEmailTemplateDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
