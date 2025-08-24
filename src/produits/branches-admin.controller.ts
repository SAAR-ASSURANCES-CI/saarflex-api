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
  UseGuards
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
import { BranchesAdminService } from './branches-admin.service';
import { 
  CreateBrancheProduitDto, 
  UpdateBrancheProduitDto, 
  BrancheProduitAdminDto,
  BranchesResponseDto 
} from './dto/branche-produit-admin.dto';
import { JwtAuthGuard } from '../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../users/guards/admin.guard';

@ApiTags('Administration - Branches de Produits')
@Controller('admin/branches')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class BranchesAdminController {
  constructor(private readonly branchesAdminService: BranchesAdminService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer une nouvelle branche de produit',
    description: 'Endpoint réservé aux administrateurs pour créer une nouvelle branche de produit'
  })
  @ApiBody({ type: CreateBrancheProduitDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Branche créée avec succès',
    type: BrancheProduitAdminDto
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
    status: 409, 
    description: 'Conflit - Une branche avec ce nom existe déjà' 
  })
  async create(
    @Body() createDto: CreateBrancheProduitDto
  ): Promise<{ status: string; message: string; data: BrancheProduitAdminDto }> {
    const branche = await this.branchesAdminService.create(createDto);
    
    return {
      status: 'success',
      message: 'Branche créée avec succès',
      data: branche
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer toutes les branches (admin)',
    description: 'Endpoint réservé aux administrateurs pour lister toutes les branches avec pagination'
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
    description: 'Liste des branches récupérée avec succès',
    type: BranchesResponseDto
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
  ): Promise<{ status: string; data: BranchesResponseDto }> {
    const branches = await this.branchesAdminService.findAll(page, limit);
    
    return {
      status: 'success',
      data: branches
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer une branche par ID (admin)',
    description: 'Endpoint réservé aux administrateurs pour consulter une branche spécifique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la branche (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Branche récupérée avec succès',
    type: BrancheProduitAdminDto
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
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ status: string; data: BrancheProduitAdminDto }> {
    const branche = await this.branchesAdminService.findOne(id);
    
    return {
      status: 'success',
      data: branche
    };
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour une branche existante',
    description: 'Endpoint réservé aux administrateurs pour modifier une branche existante'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la branche (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: UpdateBrancheProduitDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Branche mise à jour avec succès',
    type: BrancheProduitAdminDto
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
    description: 'Conflit - Une branche avec ce nom existe déjà' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBrancheProduitDto
  ): Promise<{ status: string; message: string; data: BrancheProduitAdminDto }> {
    const branche = await this.branchesAdminService.update(id, updateDto);
    
    return {
      status: 'success',
      message: 'Branche mise à jour avec succès',
      data: branche
    };
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer une branche',
    description: 'Endpoint réservé aux administrateurs pour supprimer une branche (seulement si elle n\'a pas de produits)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la branche (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Branche supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Branche supprimée avec succès' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Impossible de supprimer - La branche contient des produits' 
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
  async remove(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ status: string; message: string }> {
    const result = await this.branchesAdminService.remove(id);
    
    return {
      status: 'success',
      message: result.message
    };
  }

  @Post('reorder')
  @ApiOperation({ 
    summary: 'Réorganiser l\'ordre des branches',
    description: 'Endpoint réservé aux administrateurs pour modifier l\'ordre d\'affichage des branches'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        brancheIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Liste des IDs de branches dans le nouvel ordre',
          example: ['uuid1', 'uuid2', 'uuid3']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Ordre des branches mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Ordre des branches mis à jour avec succès' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Liste des IDs de branches invalide' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Droits administrateur requis' 
  })
  async reorderBranches(
    @Body() body: { brancheIds: string[] }
  ): Promise<{ status: string; message: string }> {
    const result = await this.branchesAdminService.reorderBranches(body.brancheIds);
    
    return {
      status: 'success',
      message: result.message
    };
  }
}
