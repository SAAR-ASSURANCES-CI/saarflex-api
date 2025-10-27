import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../users/jwt/jwt-auth.guard';
import { AgentDashboardService } from '../services/agent-dashboard.service';
import { AgentDashboardStatsDto, ChartDataDto } from '../dto/dashboard-stats.dto';

/**
 * Contrôleur du dashboard agent
 * Note: Les agents voient TOUTES les données (pas d'assignation agent-client)
 */
@ApiTags('Dashboard Agent')
@Controller('dashboard/agent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentDashboardController {
  constructor(private readonly dashboardService: AgentDashboardService) {}

  /**
   * Récupérer les statistiques globales (agent voit tout)
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques globales du dashboard agent',
    description: 'Récupère toutes les statistiques pour le dashboard agent (accès à toutes les données)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
    type: AgentDashboardStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token manquant ou invalide',
  })
  async getStats(): Promise<AgentDashboardStatsDto> {
    return await this.dashboardService.getStats();
  }

  /**
   * Récupérer les données des graphiques
   */
  @Get('charts')
  @ApiOperation({
    summary: 'Données pour les graphiques du dashboard',
    description: 'Récupère les données pour les graphiques (évolution, répartition, top produits, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Données récupérées avec succès',
    type: ChartDataDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token manquant ou invalide',
  })
  async getChartData(): Promise<ChartDataDto> {
    return await this.dashboardService.getChartData();
  }
}

