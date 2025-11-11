import { Controller, Get, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaiementsAdminService } from '../services/paiements-admin.service';
import { PaiementsListQueryDto, PaiementsListResponseDto } from '../../dto/paiements-admin.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminOrAgentGuard } from '../../../users/guards/admin-or-agent.guard';

@ApiTags('Agent - Paiements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminOrAgentGuard)
@Controller('agent/paiements')
export class PaiementsAgentController {
  private readonly logger = new Logger(PaiementsAgentController.name);

  constructor(private readonly paiementsAdminService: PaiementsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les paiements pour un agent (lecture seule)' })
  @ApiResponse({ status: 200, type: PaiementsListResponseDto })
  async getPaiements(
    @Query() query: PaiementsListQueryDto,
    @Request() req: any,
  ): Promise<PaiementsListResponseDto> {
    const utilisateurId = req.user?.id;
    this.logger.debug(
      `Requête listing paiements agent ${utilisateurId}: ${JSON.stringify(query)}`,
    );
    return this.paiementsAdminService.getPaiements(query);
  }
}

