import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { AgentsAdminService } from '../services/agents-admin.service';
import {
    CreateAgentDto,
    UpdateAgentDto,
    AgentResponseDto,
    AgentsResponseDto,
} from '../dto/agent-admin.dto';
import { JwtAuthGuard } from '../../jwt/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';

@ApiTags('Administration - Gestion des Agents')
@ApiBearerAuth()
@Controller('admin/agents')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AgentsAdminController {
    constructor(private readonly agentsAdminService: AgentsAdminService) {}

    @Post()
    @ApiOperation({
        summary: 'Créer un nouvel agent',
        description: 'Endpoint administrateur pour créer un compte agent. Un mot de passe temporaire est généré et envoyé par email.',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Agent créé avec succès',
        type: AgentResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Données invalides',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email ou téléphone déjà utilisé',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async create(@Body() createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
        return this.agentsAdminService.createAgent(createAgentDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Récupérer tous les agents',
        description: 'Endpoint administrateur pour lister tous les agents avec pagination',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Numéro de page (défaut: 1)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Nombre d\'éléments par page (défaut: 10)',
        example: 10,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Liste des agents récupérée avec succès',
        type: AgentsResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    ): Promise<AgentsResponseDto> {
        return this.agentsAdminService.getAllAgents(page, limit);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Récupérer un agent par ID',
        description: 'Endpoint administrateur pour récupérer les détails d\'un agent spécifique',
    })
    @ApiParam({
        name: 'id',
        description: 'ID de l\'agent',
        example: 'uuid-de-l-agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent récupéré avec succès',
        type: AgentResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Agent non trouvé',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async findOne(@Param('id') id: string): Promise<AgentResponseDto> {
        return this.agentsAdminService.getAgentById(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Mettre à jour un agent',
        description: 'Endpoint administrateur pour modifier les informations d\'un agent',
    })
    @ApiParam({
        name: 'id',
        description: 'ID de l\'agent',
        example: 'uuid-de-l-agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent mis à jour avec succès',
        type: AgentResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Agent non trouvé',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email ou téléphone déjà utilisé',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Données invalides',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async update(
        @Param('id') id: string,
        @Body() updateAgentDto: UpdateAgentDto,
    ): Promise<AgentResponseDto> {
        return this.agentsAdminService.updateAgent(id, updateAgentDto);
    }

    @Patch(':id/suspend')
    @ApiOperation({
        summary: 'Suspendre un agent',
        description: 'Endpoint administrateur pour suspendre le compte d\'un agent. Toutes ses sessions seront invalidées.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID de l\'agent',
        example: 'uuid-de-l-agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent suspendu avec succès',
        type: AgentResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Agent non trouvé',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Agent déjà suspendu',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async suspend(@Param('id') id: string): Promise<AgentResponseDto> {
        return this.agentsAdminService.suspendAgent(id);
    }

    @Patch(':id/activate')
    @ApiOperation({
        summary: 'Réactiver un agent',
        description: 'Endpoint administrateur pour réactiver le compte d\'un agent suspendu',
    })
    @ApiParam({
        name: 'id',
        description: 'ID de l\'agent',
        example: 'uuid-de-l-agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Agent réactivé avec succès',
        type: AgentResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Agent non trouvé',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Agent déjà actif',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async activate(@Param('id') id: string): Promise<AgentResponseDto> {
        return this.agentsAdminService.activateAgent(id);
    }

    @Post(':id/reset-password')
    @ApiOperation({
        summary: 'Réinitialiser le mot de passe d\'un agent',
        description: 'Endpoint administrateur pour réinitialiser le mot de passe d\'un agent. Un nouveau mot de passe temporaire est généré et envoyé par email. L\'agent devra changer son mot de passe à sa prochaine connexion.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID de l\'agent',
        example: 'uuid-de-l-agent',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Mot de passe réinitialisé avec succès. Email envoyé à l\'agent.',
        type: AgentResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Agent non trouvé',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token d\'authentification manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès interdit - Droits administrateur requis',
    })
    async resetPassword(@Param('id') id: string): Promise<AgentResponseDto> {
        return this.agentsAdminService.resetAgentPassword(id);
    }
}

