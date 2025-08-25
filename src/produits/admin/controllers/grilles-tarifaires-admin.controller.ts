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
import { GrillesTarifairesAdminService } from '../services/grilles-tarifaires-admin.service';
import { 
  CreateGrilleTarifaireDto, 
  UpdateGrilleTarifaireDto, 
  GrilleTarifaireDto,
  GrillesTarifairesResponseDto,
  GrilleTarifaireWithProduitDto,
  GrillesTarifairesWithProduitResponseDto
} from '../../dto/grille-tarifaire.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';
import { StatutGrille } from '../../entities/grille-tarifaire.entity';

@ApiTags('Administration - Gestion des Grilles Tarifaires')
@ApiBearerAuth()
@Controller('admin/grilles-tarifaires')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GrillesTarifairesAdminController {
  constructor(private readonly grillesTarifairesAdminService: GrillesTarifairesAdminService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle grille tarifaire',
    description: 'Endpoint administrateur pour créer une nouvelle grille tarifaire d\'assurance'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Grille tarifaire créée avec succès',
    type: GrilleTarifaireWithProduitDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produit non trouvé'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflit de dates avec une grille active existante'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async create(
    @Body() createGrilleDto: CreateGrilleTarifaireDto,
    @Request() req: any
  ): Promise<GrilleTarifaireWithProduitDto> {
    return this.grillesTarifairesAdminService.create(createGrilleDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les grilles tarifaires',
    description: 'Endpoint administrateur pour lister toutes les grilles tarifaires avec pagination et données du produit associé'
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
    description: 'Liste des grilles tarifaires avec données du produit récupérée avec succès',
    type: GrillesTarifairesWithProduitResponseDto
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
  ): Promise<GrillesTarifairesWithProduitResponseDto> {
    return this.grillesTarifairesAdminService.findAll(page, limit);
  }

  @Get('produit/:produitId')
  @ApiOperation({
    summary: 'Récupérer les grilles tarifaires d\'un produit',
    description: 'Endpoint administrateur pour lister toutes les grilles tarifaires d\'un produit spécifique avec données du produit'
  })
  @ApiParam({
    name: 'produitId',
    description: 'ID du produit',
    example: 'uuid-du-produit'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grilles tarifaires du produit avec données du produit récupérées avec succès',
    type: [GrilleTarifaireWithProduitDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findAllByProduit(@Param('produitId') produitId: string): Promise<GrilleTarifaireWithProduitDto[]> {
    return this.grillesTarifairesAdminService.findAllByProduit(produitId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une grille tarifaire par ID',
    description: 'Endpoint administrateur pour récupérer les détails d\'une grille tarifaire spécifique avec données du produit associé'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grille tarifaire avec données du produit récupérée avec succès',
    type: GrilleTarifaireWithProduitDto
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
  async findOne(@Param('id') id: string): Promise<GrilleTarifaireWithProduitDto> {
    return this.grillesTarifairesAdminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une grille tarifaire',
    description: 'Endpoint administrateur pour modifier une grille tarifaire existante'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grille tarifaire mise à jour avec succès',
    type: GrilleTarifaireWithProduitDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grille tarifaire non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflit de dates avec une grille active existante'
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
    @Body() updateGrilleDto: UpdateGrilleTarifaireDto
  ): Promise<GrilleTarifaireWithProduitDto> {
    return this.grillesTarifairesAdminService.update(id, updateGrilleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une grille tarifaire',
    description: 'Endpoint administrateur pour supprimer une grille tarifaire (seulement si elle n\'a pas de tarifs associés)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Grille tarifaire supprimée avec succès'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grille tarifaire non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Impossible de supprimer - Tarifs associés existants'
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
    return this.grillesTarifairesAdminService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Changer le statut d\'une grille tarifaire',
    description: 'Endpoint administrateur pour changer le statut d\'une grille tarifaire (actif, inactif, futur)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statut de la grille tarifaire modifié avec succès',
    type: GrilleTarifaireWithProduitDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grille tarifaire non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflit de dates avec une grille active existante'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: StatutGrille
  ): Promise<GrilleTarifaireWithProduitDto> {
    return this.grillesTarifairesAdminService.changeStatus(id, status);
  }

  @Get(':id/tarifs')
  @ApiOperation({
    summary: 'Récupérer les tarifs d\'une grille tarifaire',
    description: 'Endpoint administrateur pour lister tous les tarifs d\'une grille tarifaire spécifique'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la grille tarifaire',
    example: 'uuid-de-la-grille'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarifs de la grille tarifaire récupérés avec succès',
    type: 'array'
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
  async getTarifsByGrille(@Param('id') id: string): Promise<any[]> {
    return this.grillesTarifairesAdminService.getTarifsByGrille(id);
  }
}
