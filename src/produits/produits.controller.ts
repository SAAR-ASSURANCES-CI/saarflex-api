import { Controller, Get, Param, Query, ParseUUIDPipe, ParseEnumPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProduitsService } from './produits.service';
import { ProduitDto, ProduitQueryDto, ProduitsResponseDto } from './dto/produit.dto';
import { BrancheProduitDto } from './dto/branche-produit.dto';
import { TypeProduit } from './entities/produit.entity';
import { JwtAuthGuard } from '../users/jwt/jwt-auth.guard';

@ApiTags('Produits')
@Controller('produits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProduitsController {
    constructor(private readonly produitsService: ProduitsService) {}

    @Get()
    @ApiOperation({ 
        summary: 'Récupérer tous les produits actifs',
        description: 'Endpoint protégé pour consulter tous les produits d\'assurance disponibles avec pagination et filtres. Authentification requise.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Liste des produits récupérée avec succès',
        type: ProduitsResponseDto
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Paramètres de requête invalides' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
    })
    @ApiQuery({ 
        name: 'type', 
        enum: TypeProduit, 
        required: false, 
        description: 'Filtrer par type de produit (vie ou non-vie)',
        example: 'vie'
    })
    @ApiQuery({ 
        name: 'branche_id', 
        required: false, 
        description: 'Filtrer par branche (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiQuery({ 
        name: 'search', 
        required: false, 
        description: 'Recherche textuelle dans le nom et description',
        example: 'assurance retraite'
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
    @ApiQuery({ 
        name: 'sort_by', 
        required: false, 
        description: 'Champ de tri (défaut: created_at)',
        enum: ['nom', 'type', 'created_at', 'branche.ordre'],
        example: 'nom'
    })
    @ApiQuery({ 
        name: 'sort_order', 
        enum: ['ASC', 'DESC'], 
        required: false, 
        description: 'Ordre de tri (défaut: DESC)',
        example: 'ASC'
    })
    async findAll(@Query() query: ProduitQueryDto): Promise<ProduitsResponseDto> {
        return this.produitsService.findAll(query);
    }

    @Get('type/:type')
    @ApiOperation({ 
        summary: 'Récupérer les produits par type',
        description: 'Endpoint protégé pour consulter tous les produits d\'un type spécifique (vie ou non-vie). Authentification requise.'
    })
    @ApiParam({ 
        name: 'type', 
        enum: TypeProduit, 
        description: 'Type de produit (vie ou non-vie)',
        example: 'vie'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Liste des produits du type spécifié',
        type: [ProduitDto]
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Type de produit invalide' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
    })
    async findByType(
        @Param('type', new ParseEnumPipe(TypeProduit)) type: TypeProduit
    ): Promise<ProduitDto[]> {
        return this.produitsService.findByType(type);
    }

    @Get('branche/:brancheId')
    @ApiOperation({ 
        summary: 'Récupérer les produits par branche',
        description: 'Endpoint protégé pour consulter tous les produits d\'une branche spécifique. Authentification requise.'
    })
    @ApiParam({ 
        name: 'brancheId', 
        description: 'ID de la branche (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Liste des produits de la branche spécifiée',
        type: [ProduitDto]
    })
    @ApiResponse({ 
        status: 400, 
        description: 'ID de branche invalide' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
    })
    async findByBranche(
        @Param('brancheId', ParseUUIDPipe) brancheId: string
    ): Promise<ProduitDto[]> {
        return this.produitsService.findByBranche(brancheId);
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

    @Get('branches/all')
    @ApiOperation({ 
        summary: 'Récupérer toutes les branches',
        description: 'Endpoint protégé pour consulter toutes les branches de produits disponibles. Authentification requise.'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Liste des branches récupérée avec succès',
        type: [BrancheProduitDto]
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
    })
    @ApiResponse({ 
        status: 500, 
        description: 'Erreur serveur interne' 
    })
    async findAllBranches(): Promise<BrancheProduitDto[]> {
        return this.produitsService.findAllBranches();
    }
}
