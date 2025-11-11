import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaiementsAdminService } from '../services/paiements-admin.service';
import { PaiementsListQueryDto, PaiementsListResponseDto } from '../../dto/paiements-admin.dto';
import { JwtAuthGuard } from '../../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../../users/guards/admin.guard';

@ApiTags('Administration - Paiements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/paiements')
export class PaiementsAdminController {
  private readonly logger = new Logger(PaiementsAdminController.name);

  constructor(private readonly paiementsAdminService: PaiementsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les paiements' })
  @ApiResponse({ status: 200, type: PaiementsListResponseDto })
  async getPaiements(
    @Query() query: PaiementsListQueryDto,
  ): Promise<PaiementsListResponseDto> {
    this.logger.debug(`Requête listing paiements admin: ${JSON.stringify(query)}`);
    return this.paiementsAdminService.getPaiements(query);
  }
}

