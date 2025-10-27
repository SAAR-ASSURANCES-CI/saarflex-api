import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour les paramètres de requête du listing des clients
 */
export class ClientListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  statut?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * DTO pour la réponse du listing des clients
 */
export class ClientListResponseDto {
  data: ClientItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO pour un élément client dans le listing
 */
export class ClientItemDto {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  statut: boolean;
  derniere_connexion: Date | null;
  date_creation: Date;
}

