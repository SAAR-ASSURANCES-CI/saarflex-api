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
  Request,
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
import { DevisSauvegardeService } from '../services/devis-sauvegarde.service';
import { 
  SauvegardeDevisDto, 
  DevisSauvegardeDto,
  DevisSauvegardesResponseDto,
  ModifierDevisSauvegardeDto,
  FiltresRechercheDevisDto
} from '../../dto/devis-sauvegarde.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';

@ApiTags('Devis Sauvegardés')
@Controller('devis-sauvegardes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevisSauvegardeController {
  constructor(private readonly devisSauvegardeService: DevisSauvegardeService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Sauvegarder un devis simulé',
    description: 'Permet à un utilisateur connecté de sauvegarder un devis simulé dans son espace personnel'
  })
  @ApiBody({ type: SauvegardeDevisDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Devis sauvegardé avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides ou devis expiré' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès interdit - Vous n\'êtes pas autorisé à sauvegarder ce devis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé' 
  })
  async sauvegarderDevis(
    @Body() sauvegardeDto: SauvegardeDevisDto,
    @Request() req: any
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.sauvegarderDevis(sauvegardeDto, req.user.id);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer les devis sauvegardés de l\'utilisateur',
    description: 'Liste paginée des devis sauvegardés par l\'utilisateur connecté'
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
    description: 'Liste des devis sauvegardés récupérée avec succès',
    type: DevisSauvegardesResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  async recupererDevis(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req: any
  ): Promise<DevisSauvegardesResponseDto> {
    return this.devisSauvegardeService.recupererDevisUtilisateur(req.user.id, page, limit);
  }

  @Get('recherche')
  @ApiOperation({ 
    summary: 'Rechercher des devis sauvegardés avec filtres',
    description: 'Recherche avancée dans les devis sauvegardés de l\'utilisateur avec différents critères'
  })
  @ApiQuery({ 
    name: 'nom_produit', 
    required: false, 
    description: 'Nom du produit (recherche partielle)',
    example: 'Assurance Vie'
  })
  @ApiQuery({ 
    name: 'type_produit', 
    required: false, 
    description: 'Type de produit (vie/non-vie)',
    example: 'vie'
  })
  @ApiQuery({ 
    name: 'date_debut', 
    required: false, 
    description: 'Date de début de recherche (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @ApiQuery({ 
    name: 'date_fin', 
    required: false, 
    description: 'Date de fin de recherche (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @ApiQuery({ 
    name: 'prime_min', 
    required: false, 
    description: 'Prime minimum en FCFA',
    example: 10000
  })
  @ApiQuery({ 
    name: 'prime_max', 
    required: false, 
    description: 'Prime maximum en FCFA',
    example: 50000
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
    description: 'Résultats de recherche récupérés avec succès',
    type: DevisSauvegardesResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  async rechercherDevis(
    @Query() filtres: FiltresRechercheDevisDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req: any
  ): Promise<DevisSauvegardesResponseDto> {
    return this.devisSauvegardeService.rechercherDevis(req.user.id, filtres, page, limit);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un devis sauvegardé par ID',
    description: 'Consulter les détails d\'un devis sauvegardé spécifique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique du devis sauvegardé (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Détails du devis récupérés avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé ou vous n\'avez pas les droits pour le consulter' 
  })
  async recupererDevisParId(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.recupererDevisParId(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Modifier un devis sauvegardé',
    description: 'Modifier le nom personnalisé et les notes d\'un devis sauvegardé'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique du devis sauvegardé (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: ModifierDevisSauvegardeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Devis modifié avec succès',
    type: DevisSauvegardeDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé ou vous n\'avez pas les droits pour le modifier' 
  })
  async modifierDevis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: ModifierDevisSauvegardeDto,
    @Request() req: any
  ): Promise<DevisSauvegardeDto> {
    return this.devisSauvegardeService.modifierDevis(id, req.user.id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer un devis sauvegardé',
    description: 'Supprimer définitivement un devis sauvegardé de l\'espace utilisateur'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique du devis sauvegardé (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Devis supprimé avec succès'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé - Token d\'authentification manquant ou invalide' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Devis non trouvé ou vous n\'avez pas les droits pour le supprimer' 
  })
  async supprimerDevis(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    await this.devisSauvegardeService.supprimerDevis(id, req.user.id);
    return { message: 'Devis supprimé avec succès' };
  }
}
