import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../users/guards/admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { DashboardStatsDto, ChartDataDto } from '../dto/dashboard-stats.dto';

/**
 * Contrôleur du dashboard admin
 */
@ApiTags('Dashboard Admin')
@Controller('dashboard/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  /**
   * Récupérer les statistiques globales
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques globales du dashboard admin',
    description: 'Récupère toutes les statistiques principales pour le dashboard administrateur',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token manquant ou invalide',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès refusé - Réservé aux administrateurs',
  })
  async getStats(): Promise<DashboardStatsDto> {
    return await this.dashboardService.getStats();
  }

  /**
   * Récupérer les données des graphiques
   */
  @Get('charts')
  @ApiOperation({
    summary: 'Données pour les graphiques du dashboard',
    description: 'Récupère les données nécessaires pour afficher les graphiques et visualisations',
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
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès refusé - Réservé aux administrateurs',
  })
  async getChartData(): Promise<ChartDataDto> {
    return await this.dashboardService.getChartData();
  }
}

