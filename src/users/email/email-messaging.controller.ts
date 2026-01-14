import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpStatus,
    HttpException,
    Get,
    Request,
    OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
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
import { ContratService } from '../../produits/services/contrat.service';
import { DevisAdminService } from '../../produits/admin/services/devis-admin.service';
import { ProfileService } from '../services/profile.service';
import { ProfileDto } from '../dto/profile.dto';
import { Contrat } from '../../produits/entities/contrat.entity';
import { DevisAdminDto } from '../../produits/dto/devis-admin.dto';
import { SendEmailDto } from './dto/send-email.dto';

/**
 * Contrôleur responsable de la messagerie par email manuelle
 * Accessible uniquement aux administrateurs et aux agents
 */
@ApiTags('Emails Messaging')
@Controller('emailing')
@UseGuards(JwtAuthGuard, AdminOrAgentGuard)
@ApiBearerAuth()
export class EmailMessagingController implements OnModuleInit {
    private contratService: ContratService;
    private devisAdminService: DevisAdminService;

    constructor(
        private readonly emailService: EmailService,
        private readonly usersService: UsersService,
        private readonly emailTemplateService: EmailTemplateService,
        private readonly profileService: ProfileService,
        private readonly moduleRef: ModuleRef,
    ) { }

    onModuleInit() {
        // Résolution différée pour éviter les dépendances circulaires entre modules
        this.contratService = this.moduleRef.get(ContratService, { strict: false });
        this.devisAdminService = this.moduleRef.get(DevisAdminService, { strict: false });
    }

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
                    let clientProfile: ProfileDto | null = null;
                    let lastContrat: Contrat | null = null;
                    let lastDevis: DevisAdminDto | null = null;

                    if (client) {
                        clientProfile = await this.profileService.getProfile(client.id).catch(() => null);

                        // Gestion de la référence spécifique (Contrat ou Devis)
                        if (dto.referenceId && dto.referenceType) {
                            if (dto.referenceType === 'CONTRAT') {
                                lastContrat = await this.contratService.obtenirContratParId(dto.referenceId).catch(() => null);
                            } else if (dto.referenceType === 'DEVIS') {
                                lastDevis = await this.devisAdminService.getDevisById(dto.referenceId).catch(() => null);
                            }
                        }

                        // Fallback : si pas de référence ou objet non trouvé, on prend le dernier
                        if (!lastContrat) {
                            const contrats = await this.contratService.obtenirContratsUtilisateur(client.id).catch(() => []);
                            if (contrats && contrats.length > 0) {
                                lastContrat = contrats[0];
                            }
                        }

                        if (!lastDevis) {
                            const devisList = await this.devisAdminService.getAllDevis({
                                utilisateur_id: client.id,
                                limit: 1
                            }, client.type_utilisateur).catch(() => null);
                            if (devisList && devisList.data && devisList.data.length > 0) {
                                lastDevis = devisList.data[0];
                            }
                        }
                    }

                    const context = {
                        // Identité Client
                        client_nom: client?.nom || 'Client',
                        client_email: email,
                        client_telephone: clientProfile?.telephone || client?.telephone || 'Non renseigné',

                        // Agent
                        agent_nom: sender?.nom || 'Votre conseiller',
                        agent_email: sender?.email || '',
                        agent_telephone: sender?.telephone || '',

                        // Contrat
                        contrat_numero: lastContrat?.numero_contrat || 'Aucun contrat actif',
                        contrat_produit: lastContrat?.produit?.nom || '',
                        contrat_echeance: lastContrat?.date_fin_couverture ? new Date(lastContrat.date_fin_couverture).toLocaleDateString('fr-FR') : '',
                        contrat_prime: lastContrat?.prime_mensuelle ? `${Number(lastContrat.prime_mensuelle).toLocaleString('fr-FR')} FCFA` : '',

                        // Devis
                        devis_reference: lastDevis?.reference || 'Aucun devis récent',
                        devis_montant: lastDevis?.prime_calculee ? `${Number(lastDevis.prime_calculee).toLocaleString('fr-FR')} FCFA` : '',

                        // Système
                        date_aujourdhui: new Date().toLocaleDateString('fr-FR'),
                        entreprise_nom: 'SAARCIFLEX',
                        espace_client_url: 'https://saarciflex.com/login',
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
