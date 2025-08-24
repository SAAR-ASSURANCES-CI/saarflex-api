import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { TarifsAdminService } from '../services/tarifs-admin.service';
import { 
  CreateTarifDto, 
  UpdateTarifDto, 
  TarifDto,
  TarifsResponseDto,
  TarifWithGrilleDto,
  TarifsWithGrilleResponseDto,
  CalculPrimeResponseDto
} from '../../dto/tarif.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';

@ApiTags('Administration - Gestion des Tarifs')
@ApiBearerAuth()
@Controller('admin/tarifs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TarifsAdminController {
  constructor(private readonly tarifsAdminService: TarifsAdminService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau tarif',
    description: 'Endpoint administrateur pour créer un nouveau tarif d\'assurance'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tarif créé avec succès',
    type: TarifWithGrilleDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides ou grille inactive'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grille tarifaire non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async create(@Body() createTarifDto: CreateTarifDto): Promise<TarifWithGrilleDto> {
    return this.tarifsAdminService.create(createTarifDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les tarifs',
    description: 'Endpoint administrateur pour lister tous les tarifs avec pagination et données de la grille associée'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'éléments par page (défaut: 10)',
    example: 10
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des tarifs avec données de la grille récupérée avec succès',
    type: TarifsWithGrilleResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<TarifsWithGrilleResponseDto> {
    return this.tarifsAdminService.findAll(page, limit);
  }

  @Get('grille/:grilleId')
  @ApiOperation({
    summary: 'Récupérer les tarifs d\'une grille tarifaire',
    description: 'Endpoint administrateur pour lister tous les tarifs d\'une grille tarifaire spécifique avec données de la grille'
  })
  @ApiParam({
    name: 'grilleId',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarifs de la grille avec données de la grille récupérés avec succès',
    type: [TarifWithGrilleDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findAllByGrille(@Param('grilleId') grilleId: string): Promise<TarifWithGrilleDto[]> {
    return this.tarifsAdminService.findAllByGrille(grilleId);
  }

  @Get('produit/:produitId')
  @ApiOperation({
    summary: 'Récupérer les tarifs d\'un produit',
    description: 'Endpoint administrateur pour lister tous les tarifs d\'un produit spécifique avec données de la grille'
  })
  @ApiParam({
    name: 'produitId',
    description: 'ID du produit',
    example: 'uuid-du-produit'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarifs du produit avec données de la grille récupérés avec succès',
    type: [TarifWithGrilleDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findAllByProduit(@Param('produitId') produitId: string): Promise<TarifWithGrilleDto[]> {
    return this.tarifsAdminService.findAllByProduit(produitId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un tarif par ID',
    description: 'Endpoint administrateur pour récupérer les détails d\'un tarif spécifique avec données de la grille associée'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du tarif',
    example: 'uuid-du-tarif'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarif avec données de la grille récupéré avec succès',
    type: TarifWithGrilleDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarif non trouvé'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findOne(@Param('id') id: string): Promise<TarifWithGrilleDto> {
    return this.tarifsAdminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un tarif',
    description: 'Endpoint administrateur pour modifier un tarif existant'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du tarif',
    example: 'uuid-du-tarif'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarif mis à jour avec succès',
    type: TarifWithGrilleDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarif non trouvé'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async update(
    @Param('id') id: string,
    @Body() updateTarifDto: UpdateTarifDto
  ): Promise<TarifWithGrilleDto> {
    return this.tarifsAdminService.update(id, updateTarifDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un tarif',
    description: 'Endpoint administrateur pour supprimer un tarif'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du tarif',
    example: 'uuid-du-tarif'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tarif supprimé avec succès'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarif non trouvé'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tarifsAdminService.remove(id);
  }

  @Post('grille/:grilleId/calculer-prime')
  @ApiOperation({
    summary: 'Calculer une prime basée sur des critères',
    description: 'Endpoint administrateur pour calculer une prime en fonction des critères fournis et de la grille tarifaire'
  })
  @ApiParam({
    name: 'grilleId',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prime calculée avec succès',
    type: CalculPrimeResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grille tarifaire non trouvée ou aucun tarif correspondant'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async calculatePrime(
    @Param('grilleId') grilleId: string,
    @Body('criteres') criteres: Record<string, any>
  ): Promise<any> {
    return this.tarifsAdminService.calculatePrime(grilleId, criteres);
  }

  @Get('grille/:grilleId/par-criteres')
  @ApiOperation({
    summary: 'Rechercher des tarifs par critères',
    description: 'Endpoint administrateur pour rechercher des tarifs correspondant à des critères spécifiques dans une grille'
  })
  @ApiParam({
    name: 'grilleId',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiQuery({
    name: 'criteres',
    required: true,
    description: 'Critères de recherche (JSON)',
    example: '{"age": "25-30", "zone": "A"}'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarifs correspondants aux critères récupérés avec succès',
    type: [TarifDto]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grille tarifaire non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findTarifsByCriteres(
    @Param('grilleId') grilleId: string,
    @Query('criteres') criteres: string
  ): Promise<TarifDto[]> {
    const criteresParsed = JSON.parse(criteres);
    return this.tarifsAdminService.findTarifsByCriteres(grilleId, criteresParsed);
  }
}
