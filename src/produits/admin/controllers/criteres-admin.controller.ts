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
    ParseIntPipe
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
import { CriteresAdminService } from '../services/criteres-admin.service';
import { 
  CreateCritereTarificationDto, 
  UpdateCritereTarificationDto,
  CreateValeurCritereDto,
  UpdateValeurCritereDto,
  CritereTarificationAdminDto,
  ValeurCritereDto,
  CriteresAdminResponseDto
} from '../../dto/critere-tarification-admin.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';

@ApiTags('Administration - Critères de Tarification')
@Controller('admin/criteres')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class CriteresAdminController {
    constructor(private readonly criteresAdminService: CriteresAdminService) {}

    @Post()
    @ApiOperation({ 
        summary: 'Créer un nouveau critère de tarification',
        description: 'Endpoint réservé aux administrateurs pour créer un critère de tarification avec ses valeurs possibles'
    })
    @ApiBody({ type: CreateCritereTarificationDto })
    @ApiResponse({ 
        status: 201, 
        description: 'Critère créé avec succès',
        type: CritereTarificationAdminDto
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
        description: 'Produit non trouvé' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'Conflit - Un critère avec ce nom existe déjà pour ce produit' 
    })
    async create(
        @Body() createDto: CreateCritereTarificationDto
    ): Promise<{ status: string; message: string; data: CritereTarificationAdminDto }> {
        const critere = await this.criteresAdminService.create(createDto);
        
        return {
            status: 'success',
            message: 'Critère de tarification créé avec succès',
            data: critere
        };
    }

    @Get('produit/:produitId')
    @ApiOperation({ 
        summary: 'Récupérer tous les critères d\'un produit',
        description: 'Endpoint réservé aux administrateurs pour lister tous les critères d\'un produit spécifique'
    })
    @ApiParam({ 
        name: 'produitId', 
        description: 'ID du produit (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
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
        description: 'Critères récupérés avec succès',
        type: CriteresAdminResponseDto
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
    })
    @ApiResponse({ 
        status: 403, 
        description: 'Accès interdit - Droits administrateur requis' 
    })
    async findAllByProduit(
        @Param('produitId', ParseUUIDPipe) produitId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ): Promise<{ status: string; data: CriteresAdminResponseDto }> {
        const criteres = await this.criteresAdminService.findAllByProduit(produitId, page, limit);
        
        return {
            status: 'success',
            data: criteres
        };
    }

    @Get(':id')
    @ApiOperation({ 
        summary: 'Récupérer un critère par ID',
        description: 'Endpoint réservé aux administrateurs pour consulter un critère spécifique'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID du critère (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Critère récupéré avec succès',
        type: CritereTarificationAdminDto
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
        description: 'Critère non trouvé' 
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<{ status: string; data: CritereTarificationAdminDto }> {
        const critere = await this.criteresAdminService.findOne(id);
        
        return {
            status: 'success',
            data: critere
        };
    }

    @Put(':id')
    @ApiOperation({ 
        summary: 'Mettre à jour un critère existant',
        description: 'Endpoint réservé aux administrateurs pour modifier un critère existant'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID du critère (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiBody({ type: UpdateCritereTarificationDto })
    @ApiResponse({ 
        status: 200, 
        description: 'Critère mis à jour avec succès',
        type: CritereTarificationAdminDto
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
        description: 'Critère non trouvé' 
    })
    @ApiResponse({ 
        status: 409, 
        description: 'Conflit - Un critère avec ce nom existe déjà pour ce produit' 
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateCritereTarificationDto
    ): Promise<{ status: string; message: string; data: CritereTarificationAdminDto }> {
        const critere = await this.criteresAdminService.update(id, updateDto);
        
        return {
            status: 'success',
            message: 'Critère mis à jour avec succès',
            data: critere
        };
    }

    @Delete(':id')
    @ApiOperation({ 
        summary: 'Supprimer un critère',
        description: 'Endpoint réservé aux administrateurs pour supprimer un critère et ses valeurs associées'
    })
    @ApiParam({ 
        name: 'id', 
        description: 'ID du critère (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Critère supprimé avec succès',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                message: { type: 'string', example: 'Critère supprimé avec succès' }
            }
        }
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
        description: 'Critère non trouvé' 
    })
    async remove(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<{ status: string; message: string }> {
        const result = await this.criteresAdminService.remove(id);
        
        return {
            status: 'success',
            message: result.message
        };
    }

    @Post(':critereId/valeurs')
    @ApiOperation({ 
        summary: 'Ajouter une valeur à un critère',
        description: 'Endpoint réservé aux administrateurs pour ajouter une valeur possible à un critère existant'
    })
    @ApiParam({ 
        name: 'critereId', 
        description: 'ID du critère (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiBody({ type: CreateValeurCritereDto })
    @ApiResponse({ 
        status: 201, 
        description: 'Valeur ajoutée avec succès',
        type: ValeurCritereDto
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Données invalides ou incompatibles avec le type de critère' 
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
        description: 'Critère non trouvé' 
    })
    async addValeur(
        @Param('critereId', ParseUUIDPipe) critereId: string,
        @Body() createValeurDto: CreateValeurCritereDto
    ): Promise<{ status: string; message: string; data: ValeurCritereDto }> {
        const valeur = await this.criteresAdminService.addValeur(critereId, createValeurDto);
        
        return {
            status: 'success',
            message: 'Valeur ajoutée avec succès',
            data: valeur
        };
    }

    @Put('valeurs/:valeurId')
    @ApiOperation({ 
        summary: 'Mettre à jour une valeur de critère',
        description: 'Endpoint réservé aux administrateurs pour modifier une valeur de critère existante'
    })
    @ApiParam({ 
        name: 'valeurId', 
        description: 'ID de la valeur (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiBody({ type: UpdateValeurCritereDto })
    @ApiResponse({ 
        status: 200, 
        description: 'Valeur mise à jour avec succès',
        type: ValeurCritereDto
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Données invalides ou incompatibles avec le type de critère' 
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
        description: 'Valeur non trouvée' 
    })
    async updateValeur(
        @Param('valeurId', ParseUUIDPipe) valeurId: string,
        @Body() updateValeurDto: UpdateValeurCritereDto
    ): Promise<{ status: string; message: string; data: ValeurCritereDto }> {
        const valeur = await this.criteresAdminService.updateValeur(valeurId, updateValeurDto);
        
        return {
            status: 'success',
            message: 'Valeur mise à jour avec succès',
            data: valeur
        };
    }

    @Delete('valeurs/:valeurId')
    @ApiOperation({ 
        summary: 'Supprimer une valeur de critère',
        description: 'Endpoint réservé aux administrateurs pour supprimer une valeur de critère'
    })
    @ApiParam({ 
        name: 'valeurId', 
        description: 'ID de la valeur (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Valeur supprimée avec succès',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                message: { type: 'string', example: 'Valeur supprimée avec succès' }
            }
        }
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
        description: 'Valeur non trouvée' 
    })
    async removeValeur(
        @Param('valeurId', ParseUUIDPipe) valeurId: string
    ): Promise<{ status: string; message: string }> {
        const result = await this.criteresAdminService.removeValeur(valeurId);
        
        return {
            status: 'success',
            message: result.message
        };
    }
}
