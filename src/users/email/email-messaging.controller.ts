import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { AdminOrAgentGuard } from '../guards/admin-or-agent.guard';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

/**
 * Contrôleur responsable de la messagerie par email manuelle
 * Accessible uniquement aux administrateurs et aux agents
 */
@ApiTags('Emails Messaging')
@Controller('emailing')
@UseGuards(JwtAuthGuard, AdminOrAgentGuard)
@ApiBearerAuth()
export class EmailMessagingController {
    constructor(private readonly emailService: EmailService) { }

    /**
     * Envoi manuel d'un email
     */
    @Post('send')
    @ApiOperation({
        summary: 'Envoyer un email manuel',
        description: 'Permet à un administrateur ou un agent d\'envoyer un email à un destinataire spécifique.',
    })
    @ApiBody({ type: SendEmailDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email envoyé avec succès',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Non autorisé - Token manquant ou invalide',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Accès refusé - Réservé aux administrateurs et agents',
    })
    async sendManualEmail(@Body() dto: SendEmailDto) {
        try {
            await this.emailService.sendEmail(dto.to, dto.subject, dto.message);
            return {
                status: 'success',
                message: 'L\'email a été envoyé avec succès.',
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: 'error',
                    message: 'Erreur lors de l\'envoi de l\'email',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
