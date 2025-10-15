import { Controller, Get, Param, Patch, UseGuards, Request, HttpStatus, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { ContratService } from '../../services/contrat.service';
import { StatutContrat } from '../../entities/contrat.entity';

/**
 * Contrôleur de gestion des contrats
 */
@ApiTags('Contrats')
@Controller('contrats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContratsController {
  constructor(
    private readonly contratService: ContratService,
  ) {}

  /**
   * Récupérer tous les contrats de l'utilisateur connecté
   */
  @Get()
  @ApiOperation({ 
    summary: 'Récupérer mes contrats', 
    description: 'Récupère tous les contrats de l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des contrats récupérée avec succès'
  })
  async obtenirMesContrats(@Request() req: any) {
    const utilisateurId = req.user.id;
    return await this.contratService.obtenirContratsUtilisateur(utilisateurId);
  }

  /**
   * Récupérer un contrat spécifique par son ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un contrat par ID', 
    description: 'Récupère les détails d\'un contrat spécifique'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contrat',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contrat récupéré avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contrat non trouvé' 
  })
  async obtenirContratParId(
    @Param('id') contratId: string,
    @Request() req: any,
  ) {
    const utilisateurId = req.user.id;
    return await this.contratService.obtenirContratParId(contratId, utilisateurId);
  }

  /**
   * Récupérer un contrat par son numéro
   */
  @Get('numero/:numero')
  @ApiOperation({ 
    summary: 'Récupérer un contrat par numéro', 
    description: 'Récupère un contrat par son numéro unique (ex: VIE-2025-000001)'
  })
  @ApiParam({
    name: 'numero',
    description: 'Numéro du contrat',
    example: 'VIE-2025-000001'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contrat récupéré avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contrat non trouvé' 
  })
  async obtenirContratParNumero(@Param('numero') numeroContrat: string) {
    return await this.contratService.obtenirContratParNumero(numeroContrat);
  }

  /**
   * Résilier un contrat
   */
  @Patch(':id/resilier')
  @ApiOperation({ 
    summary: 'Résilier un contrat', 
    description: 'Résilier un contrat actif'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contrat à résilier'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contrat résilié avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contrat non trouvé' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Le contrat est déjà résilié' 
  })
  async resilierContrat(
    @Param('id') contratId: string,
    @Request() req: any,
  ) {
    const utilisateurId = req.user.id;
    return await this.contratService.resilierContrat(contratId, utilisateurId);
  }

  /**
   * Suspendre un contrat
   */
  @Patch(':id/suspendre')
  @ApiOperation({ 
    summary: 'Suspendre un contrat', 
    description: 'Suspendre temporairement un contrat actif'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contrat à suspendre'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contrat suspendu avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contrat non trouvé' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Seuls les contrats actifs peuvent être suspendus' 
  })
  async suspendreContrat(
    @Param('id') contratId: string,
    @Request() req: any,
  ) {
    const utilisateurId = req.user.id;
    return await this.contratService.suspendreContrat(contratId, utilisateurId);
  }

  /**
   * Réactiver un contrat suspendu
   */
  @Patch(':id/reactiver')
  @ApiOperation({ 
    summary: 'Réactiver un contrat', 
    description: 'Réactiver un contrat suspendu'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contrat à réactiver'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contrat réactivé avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contrat non trouvé' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Seuls les contrats suspendus peuvent être réactivés' 
  })
  async reactiverContrat(
    @Param('id') contratId: string,
    @Request() req: any,
  ) {
    const utilisateurId = req.user.id;
    return await this.contratService.reactiverContrat(contratId, utilisateurId);
  }
}

