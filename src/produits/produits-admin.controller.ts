import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
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
  ApiQuery, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { ProduitsAdminService } from './produits-admin.service';
import { 
  CreateProduitDto, 
  UpdateProduitDto, 
  ProduitAdminDto,
  ProduitsAdminResponseDto
} from './dto/produit-admin.dto';
import { JwtAuthGuard } from '../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';

@ApiTags('Administration - Produits d\'Assurance')
@Controller('admin/produits')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class ProduitsAdminController {
  constructor(private readonly produitsAdminService: ProduitsAdminService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer un nouveau produit d\'assurance',
    description: 'Endpoint réservé aux administrateurs pour créer un nouveau produit d\'assurance'
  })
  @ApiBody({ type: CreateProduitDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Produit créé avec succès',
    type: ProduitAdminDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Branche non trouvée' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflit - Un produit avec ce nom existe déjà' 
  })
  async create(
    @Body() createDto: CreateProduitDto,
    @Request() req: any
  ): Promise<{ status: string; message: string; data: ProduitAdminDto }> {
    const userId = req.user.id;
    const produit = await this.produitsAdminService.create(createDto, userId);
    
    return {
      status: 'success',
      message: 'Produit créé avec succès',
      data: produit
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les produits (admin)',
    description: 'Endpoint réservé aux administrateurs pour lister tous les produits avec pagination simple'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Numéro de page (défaut: 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Nombre d\'éléments par page (défaut: 10)',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des produits récupérée avec succès',
    type: ProduitsAdminResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{ status: string; data: ProduitsAdminResponseDto }> {
    const produits = await this.produitsAdminService.findAll(page, limit);
    
    return {
      status: 'success',
      data: produits
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un produit par ID (admin)',
    description: 'Endpoint réservé aux administrateurs pour consulter un produit spécifique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID du produit (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit récupéré avec succès',
    type: ProduitAdminDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit non trouvé' 
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ status: string; data: ProduitAdminDto }> {
    const produit = await this.produitsAdminService.findOne(id);
    
    return {
      status: 'success',
      data: produit
    };
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un produit existant',
    description: 'Endpoint réservé aux administrateurs pour modifier un produit existant'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID du produit (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: UpdateProduitDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit mis à jour avec succès',
    type: ProduitAdminDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit ou branche non trouvé' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflit - Un produit avec ce nom existe déjà' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProduitDto
  ): Promise<{ status: string; message: string; data: ProduitAdminDto }> {
    const produit = await this.produitsAdminService.update(id, updateDto);
    
    return {
      status: 'success',
      message: 'Produit mis à jour avec succès',
      data: produit
    };
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer un produit',
    description: 'Endpoint réservé aux administrateurs pour supprimer un produit (seulement s\'il n\'a pas d\'éléments associés)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID du produit (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Produit supprimé avec succès' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Impossible de supprimer - Le produit a des éléments associés' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit non trouvé' 
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ status: string; message: string }> {
    const result = await this.produitsAdminService.remove(id);
    
    return {
      status: 'success',
      message: result.message
    };
  }

  @Put(':id/status')
  @ApiOperation({ 
    summary: 'Changer le statut d\'un produit',
    description: 'Endpoint réservé aux administrateurs pour modifier le statut d\'un produit'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID du produit (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        statut: {
          type: 'string',
          enum: ['brouillon', 'actif', 'inactif'],
          description: 'Nouveau statut du produit',
          example: 'actif'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut du produit mis à jour avec succès',
    type: ProduitAdminDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Statut invalide' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit non trouvé' 
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { statut: string }
  ): Promise<{ status: string; message: string; data: ProduitAdminDto }> {
    const produit = await this.produitsAdminService.changeStatus(id, body.statut);
    
    return {
      status: 'success',
      message: `Statut du produit mis à jour vers "${body.statut}"`,
      data: produit
    };
  }
}
