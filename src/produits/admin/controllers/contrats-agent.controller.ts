import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminOrAgentGuard } from '../../../users/guards/admin-or-agent.guard';
import { ContratsAdminService } from '../services/contrats-admin.service';
import { ContratsListQueryDto, ContratAdminDto, ContratsListResponseDto, ContratsStatsDto } from '../../dto/contrats-admin.dto';

@ApiTags('Agent - Contrats')
@Controller('agent/contrats')
@UseGuards(JwtAuthGuard, AdminOrAgentGuard)
@ApiBearerAuth()
export class ContratsAgentController {
  constructor(private readonly contratsAdminService: ContratsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des contrats (agent)', description: 'Liste paginée des contrats avec filtres. Accès en lecture seule.' })
  @ApiResponse({ status: 200, description: 'Liste récupérée', type: ContratsListResponseDto })
  async getAllContrats(
    @Query() query: ContratsListQueryDto,
    @Request() req: any
  ): Promise<ContratsListResponseDto> {
    return this.contratsAdminService.getAllContrats(query, req.user.type_utilisateur);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des contrats (agent)', description: 'Accès en lecture seule.' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées', type: ContratsStatsDto })
  async getStats(): Promise<ContratsStatsDto> {
    return this.contratsAdminService.getContratsStats();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'un contrat (agent)", description: 'Accès en lecture seule.' })
  @ApiParam({ name: 'id', description: 'ID contrat', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Détails récupérés', type: ContratAdminDto })
  async getContratById(@Param('id', ParseUUIDPipe) id: string): Promise<ContratAdminDto> {
    return this.contratsAdminService.getContratById(id);
  }
}


