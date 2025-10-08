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
                name: 'SAARFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: user.email,
            subject: 'Bienvenue sur SAARFLEX - Votre compte a été créé avec succès',
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
                name: 'SAARFLEX',
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
     * Envoie un email générique
     * @param to Destinataire
     * @param subject Sujet de l'email
     * @param html Contenu HTML de l'email
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const mailOptions = {
            from: {
                name: 'SAAR ASSURANCE CI',
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
}