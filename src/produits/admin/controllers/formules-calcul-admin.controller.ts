import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { FormulesCalculAdminService } from '../services/formules-calcul-admin.service';
import { 
  CreateFormuleCalculDto, 
  UpdateFormuleCalculDto, 
  FormuleCalculDto, 
  FormulesCalculResponseDto,
  FormulesCalculWithProduitResponseDto,
  StatutFormule
} from '../../dto/formule-calcul.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('Administration - Formules de calcul')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/formules-calcul')
export class FormulesCalculAdminController {
  constructor(
    private readonly formulesCalculAdminService: FormulesCalculAdminService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle formule de calcul',
    description: 'Endpoint administrateur pour créer une formule de calcul personnalisée pour un produit d\'assurance'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Formule de calcul créée avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides ou formule invalide'
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
  async create(@Body() createFormuleDto: CreateFormuleCalculDto): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.create(createFormuleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les formules de calcul',
    description: 'Endpoint administrateur pour récupérer la liste paginée de toutes les formules de calcul'
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
    status: HttpStatus.OK,
    description: 'Formules de calcul récupérées avec succès',
    type: FormulesCalculResponseDto
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<FormulesCalculResponseDto> {
    return this.formulesCalculAdminService.findAll(page, limit);
  }

  @Get('produit/:produitId')
  @ApiOperation({
    summary: 'Récupérer les formules de calcul d\'un produit',
    description: 'Endpoint administrateur pour récupérer les formules de calcul d\'un produit spécifique'
  })
  @ApiParam({
    name: 'produitId',
    description: 'ID du produit',
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
    status: HttpStatus.OK,
    description: 'Formules de calcul du produit récupérées avec succès',
    type: FormulesCalculResponseDto
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
  async findAllByProduit(
    @Param('produitId') produitId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<FormulesCalculResponseDto> {
    return this.formulesCalculAdminService.findAllByProduit(produitId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une formule de calcul par ID',
    description: 'Endpoint administrateur pour récupérer une formule de calcul spécifique'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule de calcul',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule de calcul récupérée avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule de calcul non trouvée'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async findOne(@Param('id') id: string): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une formule de calcul',
    description: 'Endpoint administrateur pour modifier une formule de calcul existante'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule de calcul',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule de calcul modifiée avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides ou formule invalide'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule de calcul non trouvée'
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
    @Body() updateFormuleDto: UpdateFormuleCalculDto
  ): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.update(id, updateFormuleDto);
  }

  @Patch(':id/statut')
  @ApiOperation({
    summary: 'Changer le statut d\'une formule de calcul',
    description: 'Endpoint administrateur pour activer ou désactiver une formule de calcul'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule de calcul',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statut de la formule de calcul modifié avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule de calcul non trouvée'
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
    @Body('statut') statut: StatutFormule
  ): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.changeStatus(id, statut);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une formule de calcul',
    description: 'Endpoint administrateur pour supprimer définitivement une formule de calcul'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule de calcul',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Formule de calcul supprimée avec succès'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule de calcul non trouvée'
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
    return this.formulesCalculAdminService.remove(id);
  }

  @Post(':id/evaluer')
  @ApiOperation({
    summary: 'Évaluer une formule de calcul',
    description: 'Endpoint administrateur pour tester l\'évaluation d\'une formule de calcul avec des variables données'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule de calcul',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule évaluée avec succès',
    schema: {
      type: 'object',
      properties: {
        resultat: {
          type: 'number',
          description: 'Résultat de l\'évaluation de la formule',
          example: 1250.50
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Erreur d\'évaluation de la formule'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule de calcul non trouvée ou inactive'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit - Droits administrateur requis'
  })
  async evaluateFormule(
    @Param('id') id: string,
    @Body('variables') variables: Record<string, any>
  ): Promise<{ resultat: number }> {
    const resultat = await this.formulesCalculAdminService.evaluateFormule(id, variables);
    return { resultat };
  }
}
