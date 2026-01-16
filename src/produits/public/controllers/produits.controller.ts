import { Controller, Get, Param, ParseUUIDPipe, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProduitsService } from '../services/produits.service';
import { ProduitDto } from '../../dto/produit.dto';
import { GarantieWithProduitDto } from '../../dto/garanties-index.dto';
import { CriteresPublicResponseDto } from '../../dto/critere-tarification-public.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';

@ApiTags('Produits')
@Controller('produits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProduitsController {
    constructor(private readonly produitsService: ProduitsService) { }

    @Get()
    @ApiOperation({
        summary: 'Récupérer tous les produits actifs',
        description: 'Endpoint protégé pour consulter tous les produits d\'assurance actifs disponibles pour les utilisateurs. Authentification requise.'
    })
    @ApiResponse({
        status: 200,
        description: 'Liste des produits récupérée avec succès',
        type: [ProduitDto]
    })
    @ApiResponse({
        status: 401,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide'
    })
    async findAll(): Promise<ProduitDto[]> {
        return this.produitsService.findAll();
    }



    @Get(':id')
    @ApiOperation({
        summary: 'Récupérer un produit par ID',
        description: 'Endpoint protégé pour consulter les détails d\'un produit spécifique. Authentification requise.'
    })
    @ApiParam({
        name: 'id',
        description: 'ID unique du produit (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({
        status: 200,
        description: 'Détails du produit récupérés avec succès',
        type: ProduitDto
    })
    @ApiResponse({
        status: 400,
        description: 'ID de produit invalide'
    })
    @ApiResponse({
        status: 401,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide'
    })
    @ApiResponse({
        status: 404,
        description: 'Produit non trouvé'
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProduitDto> {
        return this.produitsService.findOne(id);
    }





    @Get('produit/:produitId/garanties')
    @ApiOperation({
        summary: 'Récupérer les garanties d\'un produit avec données du produit',
        description: 'Endpoint protégé pour consulter toutes les garanties actives d\'un produit spécifique avec les informations complètes du produit. Authentification requise.'
    })
    @ApiParam({
        name: 'produitId',
        description: 'ID du produit (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({
        status: 200,
        description: 'Garanties du produit avec données du produit récupérées avec succès',
        type: [GarantieWithProduitDto]
    })
    @ApiResponse({
        status: 400,
        description: 'ID de produit invalide'
    })
    @ApiResponse({
        status: 401,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide'
    })
    @ApiResponse({
        status: 404,
        description: 'Produit non trouvé'
    })
    async findGarantiesByProduit(@Param('produitId', ParseUUIDPipe) produitId: string): Promise<GarantieWithProduitDto[]> {
        return this.produitsService.findGarantiesByProduit(produitId);
    }

    @Get('garanties/:id')
    @ApiOperation({
        summary: 'Récupérer une garantie par ID avec données du produit',
        description: 'Endpoint protégé pour consulter les détails d\'une garantie active avec les informations complètes du produit associé. Authentification requise.'
    })
    @ApiParam({
        name: 'id',
        description: 'ID de la garantie (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({
        status: 200,
        description: 'Garantie avec données du produit récupérée avec succès',
        type: GarantieWithProduitDto
    })
    @ApiResponse({
        status: 400,
        description: 'ID de garantie invalide'
    })
    @ApiResponse({
        status: 401,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide'
    })
    @ApiResponse({
        status: 404,
        description: 'Garantie non trouvée'
    })
    async findGarantieWithProduit(@Param('id', ParseUUIDPipe) id: string): Promise<GarantieWithProduitDto> {
        return this.produitsService.findGarantieWithProduit(id);
    }

    @Get(':produitId/criteres')
    @ApiOperation({
        summary: 'Récupérer les critères de tarification d\'un produit',
        description: 'Endpoint protégé pour consulter tous les critères de tarification d\'un produit spécifique avec leurs valeurs possibles. Authentification requise.'
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
        description: 'Critères du produit récupérés avec succès',
        type: CriteresPublicResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'ID de produit invalide'
    })
    @ApiResponse({
        status: 401,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide'
    })
    @ApiResponse({
        status: 404,
        description: 'Produit non trouvé ou inactif'
    })
    async findCriteresByProduit(
        @Param('produitId', ParseUUIDPipe) produitId: string,
        @Query('page', ParseIntPipe) page: number = 1,
        @Query('limit', ParseIntPipe) limit: number = 10
    ): Promise<CriteresPublicResponseDto> {
        return this.produitsService.findCriteresByProduit(produitId, page, limit);
    }

    @Get(':id/duree-cotisation')
    @ApiOperation({
        summary: 'Suggérer une durée de cotisation selon l\'âge',
        description: `Recherche dans les tarifs la durée de cotisation correspondant à l'âge de l'assuré pour un produit donné.`
    })
    @ApiParam({ name: 'id', description: 'ID du produit' })
    @ApiQuery({ name: 'age', description: 'Âge de l\'assuré', type: Number })
    async findDureeCotisationByAge(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('age', ParseIntPipe) age: number
    ): Promise<{ duree: string | null }> {
        return this.produitsService.trouverDureeCotisationParAge(id, age);
    }
}
