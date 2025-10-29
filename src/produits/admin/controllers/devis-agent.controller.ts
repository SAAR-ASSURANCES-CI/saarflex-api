import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  ParseUUIDPipe, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth
} from '@nestjs/swagger';
import { DevisAdminService } from '../services/devis-admin.service';
import { 
  DevisListQueryDto,
  DevisAdminDto,
  DevisListResponseDto,
  DevisStatsDto
} from '../../dto/devis-admin.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminOrAgentGuard } from '../../../users/guards/admin-or-agent.guard';

@ApiTags('Agent - Devis')
@Controller('agent/devis')
@UseGuards(JwtAuthGuard, AdminOrAgentGuard)
@ApiBearerAuth()
export class DevisAgentController {
  constructor(private readonly devisAdminService: DevisAdminService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer la liste des devis (agent)',
    description: 'Liste paginée des devis avec filtres et recherche. Accès en lecture seule pour les agents.'
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
    description: 'Accès interdit - Droits agent ou administrateur requis' 
  })
  async getAllDevis(
    @Query() query: DevisListQueryDto,
    @Request() req: any
  ): Promise<DevisListResponseDto> {
    return this.devisAdminService.getAllDevis(query, req.user.type_utilisateur);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Récupérer les statistiques des devis (agent)',
    description: 'Statistiques globales sur les devis (total, par statut, primes, etc.). Accès en lecture seule.'
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
    description: 'Accès interdit - Droits agent ou administrateur requis' 
  })
  async getStats(): Promise<DevisStatsDto> {
    return this.devisAdminService.getDevisStats();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer les détails d\'un devis (agent)',
    description: 'Consulter les détails complets d\'un devis spécifique. Accès en lecture seule.'
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
    description: 'Accès interdit - Droits agent ou administrateur requis' 
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
}

