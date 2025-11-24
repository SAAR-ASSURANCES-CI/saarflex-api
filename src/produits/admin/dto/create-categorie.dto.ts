import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategorieDto {
    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    libelle: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsUUID()
    branche_id: string;
}
