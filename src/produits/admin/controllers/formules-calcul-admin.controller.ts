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
  DefaultValuePipe,
  UseGuards,
  HttpCode
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
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';
import { FormulesCalculAdminService } from '../services/formules-calcul-admin.service';
import { 
  CreateFormuleCalculDto, 
  UpdateFormuleCalculDto, 
  FormuleCalculDto, 
  FormulesCalculResponseDto,
  StatutFormule
} from '../../dto/formule-calcul.dto';

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
    summary: 'Créer une formule de calcul',
    description: 'Créer une nouvelle formule de calcul personnalisée pour un produit d\'assurance avec validation automatique'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Formule créée avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Formule invalide ou données incorrees'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produit non trouvé'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Droits administrateur requis'
  })
  async creerFormule(@Body() createFormuleDto: CreateFormuleCalculDto): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.create(createFormuleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Liste toutes les formules',
    description: 'Récupère la liste paginée de toutes les formules de calcul'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page (défaut: 1)',
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Éléments par page (défaut: 10, max: 50)',
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des formules récupérée',
    type: FormulesCalculResponseDto
  })
  async listerFormules(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<FormulesCalculResponseDto> {
    const limitSafe = Math.min(limit, 50);
    return this.formulesCalculAdminService.findAll(page, limitSafe);
  }

  @Get('produit/:produitId')
  @ApiOperation({
    summary: 'Formules d\'un produit',
    description: 'Récupère toutes les formules associées à un produit spécifique'
  })
  @ApiParam({
    name: 'produitId',
    description: 'ID du produit',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page',
    type: Number
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Éléments par page',
    type: Number
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formules du produit récupérées',
    type: FormulesCalculResponseDto
  })
  async listerFormulesProduit(
    @Param('produitId') produitId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<FormulesCalculResponseDto> {
    const limitSafe = Math.min(limit, 50);
    return this.formulesCalculAdminService.findAllByProduit(produitId, page, limitSafe);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détails d\'une formule',
    description: 'Récupère les détails complets d\'une formule de calcul par son ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule récupérée avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule non trouvée'
  })
  async obtenirFormule(@Param('id') id: string): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une formule',
    description: 'Modifie une formule de calcul existante avec validation automatique'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule à modifier'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule modifiée avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Formule invalide'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule non trouvée'
  })
  async modifierFormule(
    @Param('id') id: string, 
    @Body() updateFormuleDto: UpdateFormuleCalculDto
  ): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.update(id, updateFormuleDto);
  }

  @Patch(':id/statut')
  @ApiOperation({
    summary: 'Changer le statut',
    description: 'Active ou désactive une formule de calcul (seule les formules actives sont utilisées)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        statut: {
          type: 'string',
          enum: ['actif', 'inactif'],
          description: 'Nouveau statut de la formule'
        }
      },
      required: ['statut']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statut modifié avec succès',
    type: FormuleCalculDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule non trouvée'
  })
  async changerStatut(
    @Param('id') id: string,
    @Body('statut') statut: StatutFormule
  ): Promise<FormuleCalculDto> {
    return this.formulesCalculAdminService.changeStatus(id, statut);
  }

  @Post(':id/tester')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tester une formule',
    description: 'Teste l\'exécution d\'une formule avec des variables données pour vérifier son fonctionnement'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule à tester'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        variables: {
          type: 'object',
          description: 'Variables de test pour évaluer la formule',
          example: {
            age: 30,
            montant_assurance: 50000,
            profession: 'employe'
          }
        }
      },
      required: ['variables']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule testée avec succès',
    schema: {
      type: 'object',
      properties: {
        resultat: {
          type: 'number',
          description: 'Résultat du calcul de la formule',
          example: 1250.50
        },
        variables_utilisees: {
          type: 'object',
          description: 'Variables utilisées dans le calcul'
        },
        temps_execution: {
          type: 'string',
          description: 'Temps d\'exécution en millisecondes'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Erreur dans l\'évaluation de la formule'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule non trouvée ou inactive'
  })
  async testerFormule(
    @Param('id') id: string,
    @Body('variables') variables: Record<string, any>
  ): Promise<{
    resultat: number;
    variables_utilisees: Record<string, any>;
    temps_execution: string;
  }> {
    const startTime = Date.now();
    
    const resultat = await this.formulesCalculAdminService.evaluateFormule(id, variables);
    
    const endTime = Date.now();
    const executionTime = `${endTime - startTime}ms`;

    return {
      resultat,
      variables_utilisees: variables,
      temps_execution: executionTime
    };
  }

  @Post('valider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valider une formule',
    description: 'Valide la syntaxe et la logique d\'une formule avant de la sauvegarder'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formule: {
          type: 'string',
          description: 'Formule à valider',
          example: 'prime_base * (age > 25 ? 1.2 : 1.5) + PERCENTAGE(montant_assurance, 0.1)'
        },
        variables: {
          type: 'object',
          description: 'Variables utilisées dans la formule'
        }
      },
      required: ['formule', 'variables']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Formule valide',
    schema: {
      type: 'object',
      properties: {
        valide: { type: 'boolean', example: true },
        resultat_test: { type: 'number', example: 1500.25 },
        message: { type: 'string', example: 'Formule valide et fonctionnelle' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Formule invalide',
    schema: {
      type: 'object',
      properties: {
        valide: { type: 'boolean', example: false },
        erreur: { type: 'string', example: 'Syntaxe incorrecte à la ligne...' }
      }
    }
  })
  async validerFormule(
    @Body('formule') formule: string,
    @Body('variables') variables: Record<string, any>
  ): Promise<{
    valide: boolean;
    resultat_test?: number;
    message?: string;
    erreur?: string;
  }> {
    try {
      const resultat = await this.formulesCalculAdminService.evaluate(formule, variables);
      
      return {
        valide: true,
        resultat_test: resultat,
        message: 'Formule valide et fonctionnelle'
      };
    } catch (error) {
      return {
        valide: false,
        erreur: error.message
      };
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une formule',
    description: 'Supprime définitivement une formule de calcul. ⚠️ Action irréversible'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la formule à supprimer'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Formule supprimée avec succès'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Formule non trouvée'
  })
  async supprimerFormule(@Param('id') id: string): Promise<void> {
    return this.formulesCalculAdminService.remove(id);
  }

  @Get('fonctions/aide')
  @ApiOperation({
    summary: 'Documentation des fonctions',
    description: 'Récupère la liste et la documentation de toutes les fonctions disponibles dans les formules'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documentation des fonctions récupérée',
    schema: {
      type: 'object',
      properties: {
        fonctions_mathematiques: {
          type: 'array',
          items: { type: 'object' }
        },
        fonctions_avancees: {
          type: 'array',
          items: { type: 'object' }
        },
        exemples: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  async documentationFonctions() {
    return {
      fonctions_mathematiques: [
        { nom: 'MAX(a, b, ...)', description: 'Retourne la valeur maximale', exemple: 'MAX(age, 25)' },
        { nom: 'MIN(a, b, ...)', description: 'Retourne la valeur minimale', exemple: 'MIN(prime, 1000)' },
        { nom: 'ABS(x)', description: 'Valeur absolue', exemple: 'ABS(-100)' },
        { nom: 'ROUND(x)', description: 'Arrondi au nombre entier', exemple: 'ROUND(123.456)' },
        { nom: 'SQRT(x)', description: 'Racine carrée', exemple: 'SQRT(montant)' },
        { nom: 'POW(x, y)', description: 'x puissance y', exemple: 'POW(age, 2)' }
      ],
      fonctions_avancees: [
        { nom: 'LOOKUP(cle, table)', description: 'Recherche dans un objet', exemple: 'LOOKUP(profession, tarif_profession)' },
        { nom: 'LOOKUP_TABLE(ligne, colonne, table)', description: 'Recherche dans un tableau 2D', exemple: 'LOOKUP_TABLE(age_index, capital_index, grille)' },
        { nom: 'IF(condition, vrai, faux)', description: 'Condition', exemple: 'IF(age > 25, 100, 150)' },
        { nom: 'TRANCHE(valeur, tranches)', description: 'Calcul par tranches', exemple: 'TRANCHE(age, age_tranches)' },
        { nom: 'PERCENTAGE(valeur, pourcentage)', description: 'Calcul de pourcentage', exemple: 'PERCENTAGE(capital, 2.5)' },
        { nom: 'YEARS_BETWEEN(date1, date2)', description: 'Différence en années', exemple: 'YEARS_BETWEEN(date_naissance, today)' }
      ],
      exemples: [
        {
          nom: 'Assurance vie simple',
          formule: 'prime_base * (age > 25 ? 1.0 : 1.2) + PERCENTAGE(capital, 0.5)',
          description: 'Prime de base avec majoration jeune conducteur et pourcentage du capital'
        },
        {
          nom: 'Grille tarifaire complexe',
          formule: 'LOOKUP_TABLE(age_index, capital_index, grille_tarifs)',
          description: 'Recherche directe dans une grille tarifaire 2D'
        },
        {
          nom: 'Calcul progressif',
          formule: 'PROGRESSIVE(montant, [{limit: 10000, rate: 0.02}, {limit: 50000, rate: 0.015}])',
          description: 'Calcul avec taux dégressifs par tranches'
        }
      ]
    };
  }
}