import { 
  Controller, 
  Get, 
  Param, 
  UseGuards, 
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { GrillesTarifairesService } from '../services/grilles-tarifaires.service';
import { GrilleTarifaireWithProduitDto } from '../../dto/grille-tarifaire.dto';

@ApiTags('Grilles Tarifaires')
@ApiBearerAuth()
@Controller('grilles-tarifaires')
@UseGuards(JwtAuthGuard)
export class GrillesTarifairesController {
  constructor(private readonly grillesTarifairesService: GrillesTarifairesService) {}

  @Get('produit/:produitId')
  @ApiOperation({
    summary: 'Récupérer les grilles tarifaires d\'un produit',
    description: 'Endpoint public pour lister toutes les grilles tarifaires actives d\'un produit spécifique avec données du produit. Authentification requise.'
  })
  @ApiParam({
    name: 'produitId',
    description: 'ID du produit',
    example: '2fc9d842-64e0-4c12-a78a-90f3ef03f6c5'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grilles tarifaires du produit avec données du produit récupérées avec succès',
    type: [GrilleTarifaireWithProduitDto]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produit non trouvé ou inactif'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  async findAllByProduit(
    @Param('produitId', ParseUUIDPipe) produitId: string
  ): Promise<GrilleTarifaireWithProduitDto[]> {
    return this.grillesTarifairesService.findAllByProduit(produitId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une grille tarifaire par ID',
    description: 'Endpoint public pour récupérer les détails d\'une grille tarifaire active spécifique avec données du produit associé. Authentification requise.'
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
    description: 'Grille tarifaire non trouvée ou inactive'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé - Token d\'authentification manquant ou invalide'
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<GrilleTarifaireWithProduitDto> {
    return this.grillesTarifairesService.findOne(id);
  }
}
