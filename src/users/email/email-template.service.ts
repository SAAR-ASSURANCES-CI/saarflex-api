import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { getWelcomeEmailTemplate } from './templates/welcome.template';
import { getPasswordResetTemplate } from './templates/password-reset.template';

/**
 * Service responsable de la génération des templates d'emails
 */
@Injectable()
export class EmailTemplateService {
    /**
     * Génère le template HTML pour l'email de bienvenue
     * @param user Utilisateur nouvellement inscrit
     * @returns Template HTML
     */
    getWelcomeEmailTemplate(user: User): string {
        return getWelcomeEmailTemplate(user);
    }

    /**
     * Génère le template HTML pour l'email de réinitialisation de mot de passe
     * @param code Code OTP à 6 chiffres
     * @returns Template HTML
     */
    getPasswordResetTemplate(code: string): string {
        return getPasswordResetTemplate(code);
    }

    /**
     * Génère un template générique d'email
     * @param subject Sujet de l'email
     * @param content Contenu HTML de l'email
     * @returns Template HTML formaté
     */
    getGenericTemplate(subject: string, content: string): string {
        return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${content}
                <div class="footer">
                    <p>© 2025 SAARCIFLEX - Tous droits réservés</p>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

