import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from 'nodemailer';
import { User } from "../entities/user.entity";
import { EmailTemplateService } from "./email-template.service";

/**
 * Service responsable de l'envoi d'emails
 * Utilise EmailTemplateService pour la génération des templates
 */
@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly emailTemplateService: EmailTemplateService
    ) {
        this.createTransporter();
    }

    private createTransporter() {
        const smtpPort = parseInt(this.configService.get('SMTP_PORT') ?? '0');

        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST') ?? '',
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
            },
        });

        this.transporter.verify((error, success) => {
            if (error) {
                this.logger.error('Erreur de configuration SMTP:', error);
            } else {
                this.logger.log('Configuration SMTP réussie');
            }
        });
    }

    /**
     * Envoie un email de bienvenue à un nouvel utilisateur
     * @param user Utilisateur nouvellement inscrit
     */
    async sendWelcomeEmail(user: User): Promise<void> {
        const html = this.emailTemplateService.getWelcomeEmailTemplate(user);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: user.email,
            subject: 'Bienvenue sur SAARCIFLEX - Votre compte a été créé avec succès',
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de bienvenue envoyé à ${user.email}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email à ${user.email}:`, error);
        }
    }

    /**
     * Envoie un code de réinitialisation de mot de passe
     * @param email Email du destinataire
     * @param code Code OTP à 6 chiffres
     */
    async sendPasswordResetCode(email: string, code: string): Promise<void> {
        const html = this.emailTemplateService.getPasswordResetTemplate(code);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: email,
            subject: 'Code de réinitialisation de mot de passe',
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Code de réinitialisation envoyé à ${email}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi du code à ${email}:`, error);
            throw error;
        }
    }


    /**
     * Envoie un email avec les identifiants de connexion à un agent
     * @param nom Nom de l'agent
     * @param email Email de l'agent
     * @param motDePasse Mot de passe temporaire
     */
    async sendAgentCredentials(nom: string, email: string, motDePasse: string): Promise<void> {
        const html = this.emailTemplateService.getAgentCredentialsTemplate(nom, email, motDePasse);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: email,
            subject: 'Vos informations de connexion - SAARCIFLEX',
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email d'identifiants envoyé à ${email}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email d'identifiants à ${email}:`, error);
            throw error;
        }
    }

    /**
     * Envoie un email de réinitialisation de mot de passe à un agent (admin-initiated)
     * @param nom Nom de l'agent
     * @param email Email de l'agent
     * @param nouveauMotDePasse Nouveau mot de passe temporaire
     */
    async sendAgentPasswordReset(nom: string, email: string, nouveauMotDePasse: string): Promise<void> {
        const html = this.emailTemplateService.getAgentPasswordResetTemplate(nom, email, nouveauMotDePasse);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: email,
            subject: 'Réinitialisation de votre mot de passe - SAARCIFLEX',
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de réinitialisation envoyé à ${email}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email de réinitialisation à ${email}:`, error);
            throw error;
        }
    }

    /**
     * Envoie une notification de nouvelle simulation à tous les agents
     * @param agentsEmails Liste des emails des agents
     * @param reference Référence du devis
     * @param produitNom Nom du produit
     * @param clientNom Nom du client
     */
    async sendNewSimulationAgentNotification(agentsEmails: string[], reference: string, produitNom: string, clientNom: string): Promise<void> {
        if (!agentsEmails.length) return;

        const html = this.emailTemplateService.getAgentNewSimulationTemplate(reference, produitNom, clientNom);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX NOTIFICATIONS',
                address: this.configService.get('SMTP_USER'),
            },
            to: agentsEmails,
            subject: `[SAARCIFLEX] Nouvelle simulation : ${reference}`,
            html,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Notification de simulation envoyée à ${agentsEmails.length} agents`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de la notification de simulation aux agents:`, error);
        }
    }

    /**
     * Envoie une notification de nouvelle souscription à tous les agents
     * @param agentsEmails Liste des emails des agents
     * @param numeroContrat Numéro du contrat
     * @param produitNom Nom du produit
     * @param clientNom Nom du client
     * @param montant Montant payé
     */
    async sendNewSubscriptionAgentNotification(agentsEmails: string[], numeroContrat: string, produitNom: string, clientNom: string, montant: number): Promise<void> {
        if (!agentsEmails.length) return;

        const html = this.emailTemplateService.getAgentNewSubscriptionTemplate(numeroContrat, produitNom, clientNom, montant);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX NOTIFICATIONS',
                address: this.configService.get('SMTP_USER'),
            },
            to: agentsEmails,
            subject: `[SAARCIFLEX] Nouvelle souscription : ${numeroContrat}`,
            html,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Notification de souscription envoyée à ${agentsEmails.length} agents`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de la notification de souscription aux agents:`, error);
        }
    }

    /**
     * Envoie une notification de disponibilité du contrat
     * @param nom Nom de l'utilisateur
     * @param email Email de l'utilisateur
     * @param numeroContrat Numéro du contrat
     */
    async sendContractAvailabilityNotification(nom: string, email: string, numeroContrat: string): Promise<void> {
        const html = this.emailTemplateService.getContractAvailableTemplate(nom, numeroContrat);

        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: email,
            subject: 'Votre contrat est disponible - SAARCIFLEX',
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de disponibilité de contrat envoyé à ${email}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email de disponibilité à ${email}:`, error);
        }
    }

    /**
     * Envoie un email générique
     * @param to Destinataire
     * @param subject Sujet de l'email
     * @param html Contenu HTML de l'email
     */
    async sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to,
            subject,
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email envoyé à ${to}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email à ${to}:`, error);
            throw error;
        }
    }

    /**
     * Envoie un email avec une pièce jointe
     * @param to Destinataire
     * @param subject Sujet
     * @param html Contenu HTML
     * @param filename Nom du fichier
     * @param content Contenu du fichier (Buffer)
     */
    async sendEmailWithAttachment(
        to: string,
        subject: string,
        html: string,
        filename: string,
        content: Buffer
    ): Promise<void> {
        const mailOptions = {
            from: {
                name: 'SAARCIFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to,
            subject,
            html,
            attachments: [
                {
                    filename,
                    content,
                },
            ],
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email avec pièce jointe envoyé à ${to}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email avec pièce jointe à ${to}:`, error);
            throw error;
        }
    }
}