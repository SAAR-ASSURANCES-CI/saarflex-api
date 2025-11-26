import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationService } from '../services/configuration.service';
import { JwtAuthGuard } from '../../users/jwt/jwt-auth.guard';
import { AdminGuard } from '../../users/guards/admin.guard';
import { UpdateCodeAgenceDto } from '../dto/configuration.dto';

@ApiTags('Configuration')
@ApiBearerAuth()
@Controller('admin/configuration')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ConfigurationController {
    constructor(private readonly configService: ConfigurationService) { }

    /**
     * Récupère le code agence actuel
     */
    @Get('code-agence')
    @ApiOperation({ summary: 'Récupérer le code agence' })
    async getCodeAgence() {
        const code = await this.configService.getCodeAgence();
        return { code_agence: code };
    }

    /**
     * Met à jour le code agence
     */
    @Put('code-agence')
    @ApiOperation({ summary: 'Mettre à jour le code agence' })
    async updateCodeAgence(@Body() dto: UpdateCodeAgenceDto) {
        const config = await this.configService.updateCodeAgence(dto.code_agence);
        return {
            message: 'Code agence mis à jour avec succès',
            code_agence: config.valeur,
        };
    }

    /**
     * Récupère toutes les configurations
     */
    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les configurations' })
    async getAllConfigs() {
        return await this.configService.getAllConfigs();
    }
}
