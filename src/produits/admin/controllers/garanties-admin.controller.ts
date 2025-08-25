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
import { GarantiesAdminService } from '../services/garanties-admin.service';
import { 
  CreateGarantieDto, 
  UpdateGarantieDto, 
  GarantieDto,
  GarantiesResponseDto,
  CreateGarantieCritereDto,
  UpdateGarantieCritereDto,
  GarantieCritereDto,
  CreateTarifGarantieDto,
  UpdateTarifGarantieDto,
  TarifGarantieDto,
  GarantieWithProduitDto,
  GarantiesWithProduitResponseDto
} from '../../dto/garanties-index.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';

@ApiTags('Administration - Gestion des Garanties')
@ApiBearerAuth()
@Controller('admin/garanties')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GarantiesAdminController {
  constructor(private readonly garantiesAdminService: GarantiesAdminService) {}

  // ===== GESTION DES GARANTIES =====

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle garantie',
    description: 'Endpoint administrateur pour créer une nouvelle garantie d\'assurance'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Garantie créée avec succès',
    type: GarantieWithProduitDto
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
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async create(
    @Body() createGarantieDto: CreateGarantieDto,
    @Request() req: any
  ): Promise<GarantieWithProduitDto> {
    return this.garantiesAdminService.create(createGarantieDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les garanties',
    description: 'Endpoint administrateur pour lister toutes les garanties avec pagination et données du produit associé'
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
    description: 'Liste des garanties avec données du produit récupérée avec succès',
    type: GarantiesWithProduitResponseDto
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
  ): Promise<GarantiesWithProduitResponseDto> {
    return this.garantiesAdminService.findAll(page, limit);
  }

  @Get('produit/:produitId')
  @ApiOperation({
    summary: 'Récupérer les garanties d\'un produit',
    description: 'Endpoint administrateur pour lister toutes les garanties d\'un produit spécifique avec données du produit'
  })
  @ApiParam({
    name: 'produitId',
    description: 'ID du produit',
    example: 'uuid-du-produit'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Garanties du produit avec données du produit récupérées avec succès',
    type: [GarantieWithProduitDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findAllByProduit(@Param('produitId') produitId: string): Promise<GarantieWithProduitDto[]> {
    return this.garantiesAdminService.findAllByProduit(produitId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une garantie par ID',
    description: 'Endpoint administrateur pour récupérer les détails d\'une garantie spécifique avec données du produit associé'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Garantie avec données du produit récupérée avec succès',
    type: GarantieWithProduitDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Garantie non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findOne(@Param('id') id: string): Promise<GarantieWithProduitDto> {
    return this.garantiesAdminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une garantie',
    description: 'Endpoint administrateur pour modifier une garantie existante'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Garantie mise à jour avec succès',
    type: GarantieWithProduitDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Garantie non trouvée'
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
    @Body() updateGarantieDto: UpdateGarantieDto
  ): Promise<GarantieWithProduitDto> {
    return this.garantiesAdminService.update(id, updateGarantieDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une garantie',
    description: 'Endpoint administrateur pour supprimer une garantie'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Garantie supprimée avec succès'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Garantie non trouvée'
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
    return this.garantiesAdminService.remove(id);
  }

  // ===== GESTION DES CRITÈRES CONDITIONNELS =====

  @Post(':garantieId/criteres')
  @ApiOperation({
    summary: 'Ajouter un critère conditionnel à une garantie',
    description: 'Endpoint administrateur pour ajouter un critère qui conditionne l\'activation d\'une garantie'
  })
  @ApiParam({
    name: 'garantieId',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Critère ajouté avec succès',
    type: GarantieCritereDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Garantie non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides'
  })
  async addCritere(
    @Param('garantieId') garantieId: string,
    @Body() createCritereDto: CreateGarantieCritereDto
  ): Promise<GarantieCritereDto> {
    return this.garantiesAdminService.addCritere(garantieId, createCritereDto);
  }

  @Get(':garantieId/criteres')
  @ApiOperation({
    summary: 'Récupérer les critères conditionnels d\'une garantie',
    description: 'Endpoint administrateur pour lister tous les critères qui conditionnent une garantie'
  })
  @ApiParam({
    name: 'garantieId',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critères récupérés avec succès',
    type: [GarantieCritereDto]
  })
  async getCriteresByGarantie(@Param('garantieId') garantieId: string): Promise<GarantieCritereDto[]> {
    return this.garantiesAdminService.getCriteresByGarantie(garantieId);
  }

  @Patch('criteres/:id')
  @ApiOperation({
    summary: 'Mettre à jour un critère conditionnel',
    description: 'Endpoint administrateur pour modifier un critère conditionnel existant'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du critère conditionnel',
    example: 'uuid-du-critere'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Critère mis à jour avec succès',
    type: GarantieCritereDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critère non trouvé'
  })
  async updateCritere(
    @Param('id') id: string,
    @Body() updateCritereDto: UpdateGarantieCritereDto
  ): Promise<GarantieCritereDto> {
    return this.garantiesAdminService.updateCritere(id, updateCritereDto);
  }

  @Delete('criteres/:id')
  @ApiOperation({
    summary: 'Supprimer un critère conditionnel',
    description: 'Endpoint administrateur pour supprimer un critère conditionnel'
  })
  @ApiParam({
    name: 'id',
    description: 'ID du critère conditionnel',
    example: 'uuid-du-critere'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Critère supprimé avec succès'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Critère non trouvé'
  })
  async removeCritere(@Param('id') id: string): Promise<void> {
    return this.garantiesAdminService.removeCritere(id);
  }

  // ===== GESTION DES TARIFS =====

  @Post(':garantieId/tarifs')
  @ApiOperation({
    summary: 'Créer un tarif pour une garantie',
    description: 'Endpoint administrateur pour créer un nouveau tarif pour une garantie spécifique'
  })
  @ApiParam({
    name: 'garantieId',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tarif créé avec succès',
    type: TarifGarantieDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Garantie non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides'
  })
  async createTarif(
    @Param('garantieId') garantieId: string,
    @Body() createTarifDto: CreateTarifGarantieDto,
    @Request() req: any
  ): Promise<TarifGarantieDto> {
    // S'assurer que le garantie_id dans le DTO correspond à l'URL
    createTarifDto.garantie_id = garantieId;
    return this.garantiesAdminService.createTarif(createTarifDto, req.user.id);
  }

  @Get(':garantieId/tarifs')
  @ApiOperation({
    summary: 'Récupérer les tarifs d\'une garantie',
    description: 'Endpoint administrateur pour lister tous les tarifs d\'une garantie spécifique'
  })
  @ApiParam({
    name: 'garantieId',
    description: 'ID de la garantie',
    example: 'uuid-de-la-garantie'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tarifs récupérés avec succès',
    type: [TarifGarantieDto]
  })
  async getTarifsByGarantie(@Param('garantieId') garantieId: string): Promise<TarifGarantieDto[]> {
    return this.garantiesAdminService.getTarifsByGarantie(garantieId);
  }

  @Patch('tarifs/:id')
  @ApiOperation({
    summary: 'Mettre à jour un tarif de garantie',
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
    type: TarifGarantieDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tarif non trouvé'
  })
  async updateTarif(
    @Param('id') id: string,
    @Body() updateTarifDto: UpdateTarifGarantieDto
  ): Promise<TarifGarantieDto> {
    return this.garantiesAdminService.updateTarif(id, updateTarifDto);
  }

  @Delete('tarifs/:id')
  @ApiOperation({
    summary: 'Supprimer un tarif de garantie',
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
  async removeTarif(@Param('id') id: string): Promise<void> {
    return this.garantiesAdminService.removeTarif(id);
  }
}
