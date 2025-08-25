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
  ValidationPipe
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
export class SimulationDevisController {
  constructor(
    private readonly simulationDevisService: SimulationDevisService,
    private readonly devisSauvegardeService: DevisSauvegardeService,
  ) {}

  @Post('simuler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simuler un devis d\'assurance',
    description: 'Permet de simuler un devis en renseignant les critères utilisateur'
  })
  @ApiResponse({
    status: 200,
    description: 'Simulation réussie',
    type: SimulationResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou critères manquants'
  })
  @ApiResponse({
    status: 404,
    description: 'Produit ou grille tarifaire non trouvé'
  })
  async simulerDevis(
    @Body(new ValidationPipe()) simulationDto: SimulationDevisDto
  ): Promise<SimulationResponseDto> {
    return this.simulationDevisService.simulerDevis(simulationDto);
  }

  @Post('simuler-connecte')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simuler un devis d\'assurance (utilisateur connecté)',
    description: 'Simule un devis et l\'associe à l\'utilisateur connecté'
  })
  @ApiResponse({
    status: 200,
    description: 'Simulation réussie',
    type: SimulationResponseDto
  })
  async simulerDevisConnecte(
    @Request() req: any,
    @Body(new ValidationPipe()) simulationDto: SimulationDevisDto
  ): Promise<SimulationResponseDto> {
    return this.simulationDevisService.simulerDevis(
      simulationDto,
      req.user.id
    );
  }

  @Post('sauvegarder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sauvegarder un devis simulé',
    description: 'Sauvegarde un devis simulé dans l\'espace client de l\'utilisateur'
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
    status: 403,
    description: 'Non autorisé à sauvegarder ce devis'
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer mes devis sauvegardés',
    description: 'Liste paginée des devis sauvegardés par l\'utilisateur connecté'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page',
    type: Number
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre d\'éléments par page',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des devis récupérée avec succès'
  })
  async recupererMesDevis(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.devisSauvegardeService.recupererDevisSauvegardes(
      req.user.id,
      page,
      limit
    );
  }

  @Get('mes-devis/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer un devis spécifique',
    description: 'Récupère les détails d\'un devis sauvegardé par son ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du devis à récupérer'
  })
  @ApiResponse({
    status: 200,
    description: 'Devis récupéré avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé à voir ce devis'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async recupererDevisParId(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.recupererDevisParId(id, req.user.id);
  }

  @Put('mes-devis/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un devis sauvegardé',
    description: 'Met à jour le nom personnalisé ou les notes d\'un devis'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du devis à mettre à jour'
  })
  @ApiResponse({
    status: 200,
    description: 'Devis mis à jour avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé à modifier ce devis'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async mettreAJourDevis(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updates: Partial<SauvegardeDevisDto>
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.mettreAJourDevis(
      id,
      req.user.id,
      updates
    );
  }

  @Delete('mes-devis/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un devis sauvegardé',
    description: 'Supprime définitivement un devis sauvegardé'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du devis à supprimer'
  })
  @ApiResponse({
    status: 204,
    description: 'Devis supprimé avec succès'
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé à supprimer ce devis'
  })
  @ApiResponse({
    status: 404,
    description: 'Devis non trouvé'
  })
  async supprimerDevis(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<void> {
    return this.devisSauvegardeService.supprimerDevis(id, req.user.id);
  }

  @Get('rechercher')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rechercher dans mes devis',
    description: 'Recherche avancée dans les devis sauvegardés avec filtres'
  })
  @ApiQuery({
    name: 'nom_produit',
    required: false,
    description: 'Nom du produit à rechercher'
  })
  @ApiQuery({
    name: 'type_produit',
    required: false,
    description: 'Type de produit (vie, non-vie)'
  })
  @ApiQuery({
    name: 'date_debut',
    required: false,
    description: 'Date de début pour filtrer'
  })
  @ApiQuery({
    name: 'date_fin',
    required: false,
    description: 'Date de fin pour filtrer'
  })
  @ApiQuery({
    name: 'prime_min',
    required: false,
    description: 'Prime minimum'
  })
  @ApiQuery({
    name: 'prime_max',
    required: false,
    description: 'Prime maximum'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre d\'éléments par page'
  })
  @ApiResponse({
    status: 200,
    description: 'Recherche effectuée avec succès'
  })
  async rechercherDevis(
    @Request() req: any,
    @Query('nom_produit') nom_produit?: string,
    @Query('type_produit') type_produit?: string,
    @Query('date_debut') date_debut?: string,
    @Query('date_fin') date_fin?: string,
    @Query('prime_min') prime_min?: number,
    @Query('prime_max') prime_max?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const criteres = {
      nom_produit,
      type_produit,
      date_debut: date_debut ? new Date(date_debut) : undefined,
      date_fin: date_fin ? new Date(date_fin) : undefined,
      prime_min,
      prime_max
    };

    return this.devisSauvegardeService.rechercherDevis(
      req.user.id,
      criteres,
      page,
      limit
    );
  }
}
