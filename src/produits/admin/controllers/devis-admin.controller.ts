import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Param, 
  Query, 
  Body,
  ParseUUIDPipe, 
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { DevisAdminService } from '../services/devis-admin.service';
import { 
  DevisListQueryDto,
  DevisAdminDto,
  DevisListResponseDto,
  UpdateDevisStatutDto,
  DevisStatsDto
} from '../../dto/devis-admin.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';
import { UserType } from '../../../users/entities/user.entity';

@ApiTags('Administration - Devis')
@Controller('admin/devis')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class DevisAdminController {
  constructor(private readonly devisAdminService: DevisAdminService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer la liste des devis (admin)',
    description: 'Liste paginée des devis avec filtres et recherche. Accessible uniquement aux administrateurs.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des devis récupérée avec succès',
    type: DevisListResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  async getAllDevis(
    @Query() query: DevisListQueryDto,
    @Request() req: any
  ): Promise<DevisListResponseDto> {
    return this.devisAdminService.getAllDevis(query, req.user.type_utilisateur);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Récupérer les statistiques des devis (admin)',
    description: 'Statistiques globales sur les devis (total, par statut, primes, etc.)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques récupérées avec succès',
    type: DevisStatsDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  async getStats(): Promise<DevisStatsDto> {
    return this.devisAdminService.getDevisStats();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer les détails d\'un devis (admin)',
    description: 'Consulter les détails complets d\'un devis spécifique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique du devis (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Détails du devis récupérés avec succès',
    type: DevisAdminDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé' 
  })
  async getDevisById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<DevisAdminDto> {
    return this.devisAdminService.getDevisById(id);
  }

  @Patch(':id/statut')
  @ApiOperation({ 
    summary: 'Modifier le statut d\'un devis (admin)',
    description: 'Mettre à jour le statut d\'un devis. Accessible uniquement aux administrateurs.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique du devis (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: UpdateDevisStatutDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut du devis modifié avec succès',
    type: DevisAdminDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé' 
  })
  async updateStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDevisStatutDto,
    @Request() req: any
  ): Promise<DevisAdminDto> {
    return this.devisAdminService.updateDevisStatut(id, dto, req.user.type_utilisateur);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer un devis (admin)',
    description: 'Supprimer définitivement un devis. Accessible uniquement aux administrateurs.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique du devis (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Devis supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Devis supprimé avec succès' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé' 
  })
  async deleteDevis(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ): Promise<{ status: string; message: string }> {
    await this.devisAdminService.deleteDevis(id, req.user.type_utilisateur);
    return {
      status: 'success',
      message: 'Devis supprimé avec succès'
    };
  }
}

