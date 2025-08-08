import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from 'nodemailer';
import { User } from "./entities/user.entity";

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private readonly configService: ConfigService) {
        this.createTransporter();
    }

    private createTransporter() {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
            tls: {
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
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 0;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .content {
                    padding: 40px 30px;
                }
                .welcome-message {
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
                .user-info {
                    background-color: #e9ecef;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .user-info h3 {
                    color: #495057;
                    margin-top: 0;
                }
                .feature-list {
                    list-style: none;
                    padding: 0;
                }
                .feature-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid #dee2e6;
                }
                .feature-list li:before {
                    content: "✓";
                    color: #28a745;
                    font-weight: bold;
                    margin-right: 10px;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .button:hover {
                    opacity: 0.9;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Bienvenue sur SAARFLEX !</h1>
                </div>
                
                <div class="content">
                    <h2>Bonjour ${user.nom},</h2>
                    
                    <div class="welcome-message">
                        <p><strong>Félicitations !</strong> Votre compte SAARFLEX a été créé avec succès.</p>
                    </div>
                    
                    <div class="user-info">
                        <h3>Informations de votre compte :</h3>
                        <p><strong>Nom :</strong> ${user.nom}</p>
                        <p><strong>Email :</strong> ${user.email}</p>
                        <p><strong>Type de compte :</strong> ${this.getTypeUtilisateurLabel(user.type_utilisateur)}</p>
                        <p><strong>Date de création :</strong> ${new Date(user.date_creation).toLocaleDateString('fr-FR')}</p>
                    </div>
                    
                    <h3>Ce que vous pouvez faire maintenant :</h3>
                    <ul class="feature-list">
                        <li>Consulter nos offres d'assurance adaptées à vos besoins</li>
                        <li>Gérer vos contrats et polices en ligne</li>
                        <li>Accéder à votre espace client personnalisé</li>
                        <li>Contacter nos conseillers pour toute question</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="#" class="button">Accéder à mon espace client</a>
                    </div>
                    
                    <p><strong>Besoin d'aide ?</strong><br>
                    Notre équipe support est là pour vous accompagner. N'hésitez pas à nous contacter si vous avez des questions.</p>
                    
                    <p>Merci de nous faire confiance pour vos besoins en assurance.</p>
                    
                    <p>Cordialement,<br>
                    <strong>L'équipe SAARFLEX</strong></p>
                </div>
                
                <div class="footer">
                    <p>© 2025 SAARFLEX - Tous droits réservés</p>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    <p>Si vous rencontrez des problèmes, contactez-nous à : support@saarassurances.ci</p>
                </div>
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
                name: 'SAARFLEX',
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