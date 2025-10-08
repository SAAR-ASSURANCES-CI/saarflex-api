import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { ProfileDto } from '../dto/profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

/**
 * Contrôleur responsable de la gestion du profil utilisateur
 */
@ApiTags('Profile')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
    constructor(private readonly userService: UsersService) {}

    /**
     * Récupère le profil de l'utilisateur connecté
     */
    @Get('me')
    @ApiOperation({ summary: 'Mon profil' })
    @ApiResponse({ 
        status: 200, 
        description: 'Profil récupéré avec succès',
        type: ProfileDto 
    })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async getMe(
        @Request() req: any
    ): Promise<{ status: string; data: ProfileDto }> {
        const userId = req.user?.id as string;
        const data = await this.userService.getProfile(userId);
        return { status: 'success', data };
    }

    /**
     * Met à jour le profil de l'utilisateur connecté
     */
    @Patch('me')
    @ApiOperation({ summary: 'Mettre à jour mon profil' })
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({ 
        status: 200, 
        description: 'Profil mis à jour avec succès',
        type: ProfileDto 
    })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 409, description: 'Email ou téléphone déjà utilisé' })
    async updateMe(
        @Request() req: any,
        @Body() dto: UpdateProfileDto,
    ): Promise<{ status: string; message: string; data: ProfileDto }> {
        const userId = req.user?.id as string;
        const data = await this.userService.updateProfile(userId, dto);
        return { 
            status: 'success', 
            message: 'Profil mis à jour avec succès', 
            data 
        };
    }
}

