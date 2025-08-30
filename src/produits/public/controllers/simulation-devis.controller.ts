import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { SimulationDevisService } from '../services/simulation-devis.service';
import { DevisSauvegardeService } from '../services/devis-sauvegarde.service';
import {
  SimulationDevisDto,
  SimulationResponseDto,
  SauvegardeDevisDto,
  DevisSauvegardeDto
} from '../../dto/simulation-devis.dto';

@ApiTags('Simulation et Devis')
@Controller('simulation-devis')
@UseGuards(JwtAuthGuard) // Authentification obligatoire pour tout le controller
@ApiBearerAuth()
export class SimulationDevisController {
  constructor(
    private readonly simulationDevisService: SimulationDevisService,
    private readonly devisSauvegardeService: DevisSauvegardeService,
  ) {}

  @Post('simuler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simuler un devis d\'assurance',
    description: 'Simule un devis d\'assurance pour l\'utilisateur connecté en utilisant les formules configurées par l\'admin'
  })
  @ApiResponse({
    status: 200,
    description: 'Simulation réussie',
    type: SimulationResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides, critères manquants ou aucune formule configurée pour ce produit'
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 404,
    description: 'Produit ou grille tarifaire non trouvé'
  })
  async simulerDevis(
    @Request() req: any,
    @Body(new ValidationPipe()) simulationDto: SimulationDevisDto
  ): Promise<SimulationResponseDto> {
    return this.simulationDevisService.simulerDevis(
      simulationDto,
      req.user.id
    );
  }

  @Post('sauvegarder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sauvegarder un devis simulé',
    description: 'Sauvegarde un devis simulé dans l\'espace client de l\'utilisateur connecté'
  })
  @ApiResponse({
    status: 200,
    description: 'Devis sauvegardé avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({
    status: 400,
    description: 'Devis expiré ou données invalides'
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé à sauvegarder ce devis (n\'appartient pas à l\'utilisateur)'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async sauvegarderDevis(
    @Request() req: any,
    @Body(new ValidationPipe()) sauvegardeDto: SauvegardeDevisDto
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.sauvegarderDevis(
      sauvegardeDto,
      req.user.id
    );
  }

  @Get('mes-devis')
  @ApiOperation({
    summary: 'Récupérer mes devis sauvegardés',
    description: 'Liste paginée des devis sauvegardés par l\'utilisateur connecté'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page (défaut: 1)',
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre d\'éléments par page (défaut: 10, max: 100)',
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des devis récupérée avec succès'
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  async recupererMesDevis(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<{
    devis: DevisSauvegardeDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const limitSafe = Math.min(limit, 100);
    
    return this.devisSauvegardeService.recupererDevisUtilisateur(
      req.user.id,
      page,
      limitSafe
    );
  }

  @Get('devis/:id')
  @ApiOperation({
    summary: 'Récupérer un devis spécifique',
    description: 'Récupère les détails d\'un devis sauvegardé par l\'utilisateur connecté'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du devis à récupérer',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Devis récupéré avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Ce devis n\'appartient pas à l\'utilisateur'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async recupererDevis(
    @Request() req: any,
    @Param('id') devisId: string
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.recupererDevisParId(
      devisId,
      req.user.id
    );
  }

  @Put('devis/:id')
  @ApiOperation({
    summary: 'Modifier un devis sauvegardé',
    description: 'Modifie le nom ou les notes d\'un devis sauvegardé'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du devis à modifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Devis modifié avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Ce devis n\'appartient pas à l\'utilisateur'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async modifierDevis(
    @Request() req: any,
    @Param('id') devisId: string,
    @Body(new ValidationPipe()) updateData: {
      nom_personnalise?: string;
      notes?: string;
    }
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.modifierDevis(
      devisId,
      req.user.id,
      updateData
    );
  }

  @Delete('devis/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un devis sauvegardé',
    description: 'Supprime définitivement un devis sauvegardé de l\'utilisateur'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du devis à supprimer',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 204,
    description: 'Devis supprimé avec succès'
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Ce devis n\'appartient pas à l\'utilisateur'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async supprimerDevis(
    @Request() req: any,
    @Param('id') devisId: string
  ): Promise<void> {
    return this.devisSauvegardeService.supprimerDevis(
      devisId,
      req.user.id
    );
  }
}