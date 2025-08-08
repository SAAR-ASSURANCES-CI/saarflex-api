import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from 'nodemailer';
import { User } from "../entities/user.entity";

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private readonly configService: ConfigService) {
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

    async sendWelcomeEmail(user: User): Promise<void> {
        const mailOptions = {
            from: {
                name: 'SAARFLEX',
                address: this.configService.get('SMTP_USER'),
            },
            to: user.email,
            subject: 'Bienvenue sur SAARFLEX - Votre compte a été créé avec succès',
            html: this.getWelcomeEmailTemplate(user),
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email de bienvenue envoyé à ${user.email}: ${result.messageId}`);
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de l'email à ${user.email}:`, error);
        }
    }

    private getWelcomeEmailTemplate(user: User): string {
        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenue sur SAARFLEX</title>
            <!--[if mso]>
            <noscript>
                <xml>
                    <o:OfficeDocumentSettings>
                        <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                </xml>
            </noscript>
            <![endif]-->
            <style>
                body {
                    font-family: Arial, sans-serif !important;
                    line-height: 1.6;
                    color: #333333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                }
                table {
                    border-collapse: collapse;
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                }
                .header-table {
                    width: 100%;
                    background-color: #dc3545;
                    color: #ffffff;
                }
                .header-cell {
                    padding: 30px;
                    text-align: center;
                    color: #ffffff;
                }
                .header-title {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                    color: #ffffff;
                }
                .content-table {
                    width: 100%;
                    background-color: #ffffff;
                }
                .content-cell {
                    padding: 40px 30px;
                }
                .welcome-message {
                    background-color: #f8f9fa;
                    border-left: 4px solid #dc3545;
                    padding: 20px;
                    margin: 20px 0;
                }
                .user-info {
                    background-color: #e9ecef;
                    padding: 15px;
                    margin: 20px 0;
                }
                .user-info h3 {
                    color: #495057;
                    margin-top: 0;
                    margin-bottom: 10px;
                }
                .feature-item {
                    padding: 8px 0;
                    border-bottom: 1px solid #dee2e6;
                }
                .checkmark {
                    color: #28a745;
                    font-weight: bold;
                    margin-right: 10px;
                }
                .button-table {
                    width: 100%;
                    text-align: center;
                    margin: 20px 0;
                }
                .button-cell {
                    padding: 12px 24px;
                    background-color: #dc3545;
                    text-align: center;
                }
                .button-link {
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-block;
                }
                .footer-table {
                    width: 100%;
                    background-color: #f8f9fa;
                }
                .footer-cell {
                    padding: 20px 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                /* Outlook specific */
                .mso-hide {
                    mso-hide: all;
                }
                
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .content-cell {
                        padding: 20px 15px !important;
                    }
                    .header-cell {
                        padding: 20px 15px !important;
                    }
                }
            </style>
        </head>
        <body>
            <div style="background-color: #f4f4f4; padding: 20px 0;">
                <table class="container" cellpadding="0" cellspacing="0" border="0">
                    <!-- Header -->
                    <tr>
                        <td>
                            <table class="header-table" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="header-cell">
                                        <h1 class="header-title">🎉 Bienvenue sur SAARFLEX !</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td>
                            <table class="content-table" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="content-cell">
                                        <h2 style="color: #333333; margin-top: 0;">Bonjour ${user.nom},</h2>
                                        
                                        <div class="welcome-message">
                                            <p><strong>Félicitations !</strong> Votre compte SAARFLEX a été créé avec succès.</p>
                                        </div>
                                        
                                        <div class="user-info">
                                            <h3>Informations de votre compte :</h3>
                                            <p style="margin: 5px 0;"><strong>Nom :</strong> ${user.nom}</p>
                                            <p style="margin: 5px 0;"><strong>Email :</strong> ${user.email}</p>
                                            <p style="margin: 5px 0;"><strong>Type de compte :</strong> ${this.getTypeUtilisateurLabel(user.type_utilisateur)}</p>
                                            <p style="margin: 5px 0;"><strong>Date de création :</strong> ${new Date(user.date_creation).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                        
                                        <h3 style="color: #333333;">Ce que vous pouvez faire maintenant :</h3>
                                        
                                        <div class="feature-item">
                                            <span class="checkmark">✓</span>Consulter nos offres d'assurance adaptées à vos besoins
                                        </div>
                                        <div class="feature-item">
                                            <span class="checkmark">✓</span>Gérer vos contrats et polices en ligne
                                        </div>
                                        <div class="feature-item">
                                            <span class="checkmark">✓</span>Accéder à votre espace client personnalisé
                                        </div>
                                        <div class="feature-item">
                                            <span class="checkmark">✓</span>Contacter nos conseillers pour toute question
                                        </div>
                                        
                                        
                                        <p><strong>Besoin d'aide ?</strong><br>
                                        Notre équipe support est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez des questions.</p>
                                        
                                        <p>Merci de nous faire confiance pour vos besoins en assurance.</p>
                                        
                                        <p>Cordialement,<br>
                                        <strong>L'équipe SAAR ASSURANCE CÔTE D'IVOIRE</strong></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td>
                            <table class="footer-table" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="footer-cell">
                                        <p style="margin: 5px 0;">© 2025 SAARFLEX - Tous droits réservés</p>
                                        <p style="margin: 5px 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                                        <p style="margin: 5px 0;">Si vous rencontrez des problèmes, contactez-nous à : support@saarassurances.ci</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
        </body>
        </html>
        `;
    }

    private getTypeUtilisateurLabel(type: string): string {
        const labels = {
            'client': 'Client',
            'agent': 'Agent',
            'drh': 'DRH',
            'admin': 'Administrateur'
        };
        return labels[type] || 'Client';
    }

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