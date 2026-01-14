import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpStatus,
    HttpException,
    Get,
    Request,
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
import { UsersService } from '../users.service';
import { EmailTemplateService } from './email-template.service';
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
    constructor(
        private readonly emailService: EmailService,
        private readonly usersService: UsersService,
        private readonly emailTemplateService: EmailTemplateService,
    ) { }

    /**
     * Liste des variables dynamiques disponibles
     */
    @Get('variables')
    @ApiOperation({ summary: 'Liste des variables dynamiques' })
    getVariables() {
        return {
            status: 'success',
            data: this.emailTemplateService.getAvailableVariables()
        };
    }

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
    async sendManualEmail(@Body() dto: SendEmailDto, @Request() req: any) {
        try {
            const senderId = req.user?.id;
            const sender = senderId ? await this.usersService.findById(senderId).catch(() => null) : null;

            const recipients = Array.isArray(dto.to)
                ? dto.to
                : dto.to.split(',').map(e => e.trim()).filter(e => e.length > 0);

            const hasVariables = /\{\{([^}]+)\}\}/.test(dto.message) || /\{\{([^}]+)\}\}/.test(dto.subject);

            if (!hasVariables) {
                // Habillage générique même sans variables
                const styledMessage = this.emailTemplateService.getGenericTemplate(dto.subject, dto.message);
                await this.emailService.sendEmail(recipients, dto.subject, styledMessage);
            } else {
                // Envoi personnalisé par destinataire
                for (const email of recipients) {
                    const client = await this.usersService.findByEmail(email).catch(() => null);

                    const context = {
                        client_nom: client?.nom || 'Client',
                        client_email: email,
                        agent_nom: sender?.nom || 'Votre conseiller',
                        date_aujourdhui: new Date().toLocaleDateString('fr-FR'),
                        date_heure: new Date().toLocaleString('fr-FR'),
                        entreprise_nom: 'SAARCIFLEX',
                    };

                    const personalizedSubject = this.emailTemplateService.replaceVariables(dto.subject, context);
                    const personalizedMessage = this.emailTemplateService.replaceVariables(dto.message, context);

                    // Habillage avec le template SAARCIFLEX
                    const styledMessage = this.emailTemplateService.getGenericTemplate(personalizedSubject, personalizedMessage);

                    await this.emailService.sendEmail(email, personalizedSubject, styledMessage);
                }
            }

            return {
                status: 'success',
                message: hasVariables
                    ? `Emails personnalisés envoyés avec succès à ${recipients.length} destinataire(s).`
                    : 'L\'email a été envoyé avec succès.',
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
