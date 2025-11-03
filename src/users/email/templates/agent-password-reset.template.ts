/**
 * Template HTML pour l'email de réinitialisation de mot de passe agent (admin-initiated)
 */
export function getAgentPasswordResetTemplate(
    nom: string,
    email: string,
    nouveauMotDePasse: string
): string {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de votre mot de passe - SAARCIFLEX</title>
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
            .credentials-box {
                background-color: #e9ecef;
                border: 2px solid #dc3545;
                border-radius: 5px;
                padding: 20px;
                margin: 20px 0;
            }
            .credential-item {
                padding: 10px 0;
                border-bottom: 1px solid #dee2e6;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .credential-label {
                font-weight: bold;
                color: #495057;
                display: inline-block;
                width: 150px;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background-color: #ffffff;
                padding: 5px 10px;
                border-radius: 3px;
                color: #dc3545;
                font-weight: bold;
                font-size: 16px;
            }
            .info-box {
                background-color: #d1ecf1;
                border-left: 4px solid #0c5460;
                padding: 15px;
                margin: 20px 0;
            }
            .warning-box {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
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
            @media screen and (max-width: 600px) {
                .container {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                .content-cell {
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
                                    <h1 class="header-title">🔑 Réinitialisation de mot de passe</h1>
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
                                    <h2 style="color: #333333; margin-top: 0;">Bonjour ${nom},</h2>
                                    
                                    <p>Un administrateur a réinitialisé votre mot de passe. Voici vos nouveaux identifiants de connexion :</p>
                                    
                                    <div class="credentials-box">
                                        <h3 style="margin-top: 0; color: #dc3545;">Vos identifiants mis à jour :</h3>
                                        <div class="credential-item">
                                            <span class="credential-label">Email :</span>
                                            <span class="credential-value">${email}</span>
                                        </div>
                                        <div class="credential-item">
                                            <span class="credential-label">Nouveau mot de passe :</span>
                                            <span class="credential-value">${nouveauMotDePasse}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="warning-box">
                                        <p style="margin: 0;"><strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre prochaine connexion.</p>
                                    </div>
                                    
                                    <div class="info-box">
                                        <p style="margin: 0;"><strong>ℹ️ Information :</strong> Si vous n'avez pas demandé cette réinitialisation, veuillez contacter immédiatement l'administrateur et changer votre mot de passe.</p>
                                    </div>
                                    
                                    <h3 style="color: #333333;">Prochaines étapes :</h3>
                                    <ol>
                                        <li>Connectez-vous avec votre email et le nouveau mot de passe</li>
                                        <li>Changez votre mot de passe pour un mot de passe personnel</li>
                                        <li>Assurez-vous d'utiliser un mot de passe fort et unique</li>
                                    </ol>
                                    
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
                                    <p style="margin: 5px 0;">© 2025 SAARCIFLEX - Tous droits réservés</p>
                                    <p style="margin: 5px 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
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

