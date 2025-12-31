import { Controller, Get, Patch, Param, Query, Body, UseGuards, ParseUUIDPipe, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';
import { UserType } from '../../../users/entities/user.entity';
import { ContratsAdminService } from '../services/contrats-admin.service';
import { ContratsListQueryDto, ContratAdminDto, ContratsListResponseDto, UpdateContratStatutDto, ContratsStatsDto } from '../../dto/contrats-admin.dto';

@ApiTags('Administration - Contrats')
@Controller('admin/contrats')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class ContratsAdminController {
  constructor(private readonly contratsAdminService: ContratsAdminService) { }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des contrats (admin)', description: 'Liste paginée des contrats avec filtres.' })
  @ApiResponse({ status: 200, description: 'Liste récupérée', type: ContratsListResponseDto })
  async getAllContrats(
    @Query() query: ContratsListQueryDto,
    @Request() req: any
  ): Promise<ContratsListResponseDto> {
    return this.contratsAdminService.getAllContrats(query, req.user.type_utilisateur);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des contrats (admin)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées', type: ContratsStatsDto })
  async getStats(): Promise<ContratsStatsDto> {
    return this.contratsAdminService.getContratsStats();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'un contrat (admin)" })
  @ApiParam({ name: 'id', description: 'ID contrat', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Détails récupérés', type: ContratAdminDto })
  async getContratById(@Param('id', ParseUUIDPipe) id: string): Promise<ContratAdminDto> {
    return this.contratsAdminService.getContratById(id);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: "Modifier le statut d'un contrat (admin)" })
  @ApiParam({ name: 'id', description: 'ID contrat', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateContratStatutDto })
  @ApiResponse({ status: 200, description: 'Statut modifié', type: ContratAdminDto })
  async updateStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContratStatutDto,
    @Request() req: any
  ): Promise<ContratAdminDto> {
    return this.contratsAdminService.updateContratStatut(id, dto, req.user.type_utilisateur as UserType);
  }

  @Patch(':id/upload')
  @ApiOperation({ summary: "Téléverser le contrat final (PDF)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/contrats',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(pdf)$/)) {
        return cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
      }
      cb(null, true);
    }
  }))
  async uploadContrat(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<ContratAdminDto> {
    return this.contratsAdminService.uploadContratFinal(id, file);
  }
}


