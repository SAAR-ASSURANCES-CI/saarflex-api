import { Controller, Post, Body, UseGuards, Request, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { SimulationDevisSimplifieeService } from '../services/simulation-devis-simplifie.service';
import { 
  CreateSimulationDevisSimplifieeDto, 
  SimulationDevisSimplifieeResponseDto 
} from '../../dto/simulation-devis-simplifie.dto';

@ApiTags('Simulation Devis Simplifiée')
@Controller('simulation-devis-simplifie')
export class SimulationDevisSimplifieeController {
  constructor(
    private readonly simulationService: SimulationDevisSimplifieeService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Simuler un devis avec le système simplifié',
    description: 'Crée une simulation de devis avec tarifs fixes basés sur des critères simples'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Simulation créée avec succès',
    type: SimulationDevisSimplifieeResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async simulerDevis(
    @Body() simulationDto: CreateSimulationDevisSimplifieeDto,
    @Request() req: any
  ): Promise<SimulationDevisSimplifieeResponseDto> {
    const userId = req.user?.id;
    
    return this.simulationService.simulerDevisSimple(
      simulationDto,
      userId
    );
  }

  @Post('anonyme')
  @ApiOperation({ 
    summary: 'Simuler un devis de manière anonyme',
    description: 'Crée une simulation de devis sans authentification (seulement pour "autre personne")'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Simulation créée avec succès',
    type: SimulationDevisSimplifieeResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async simulerDevisAnonyme(
    @Body() simulationDto: CreateSimulationDevisSimplifieeDto
  ): Promise<SimulationDevisSimplifieeResponseDto> {
    
    if (simulationDto.assure_est_souscripteur) {
      throw new Error('Les simulations anonymes nécessitent les informations de l\'assuré');
    }

    return this.simulationService.simulerDevisSimple(simulationDto);
  }
}
