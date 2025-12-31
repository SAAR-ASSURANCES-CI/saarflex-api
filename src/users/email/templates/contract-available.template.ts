/**
 * Template pour l'email de disponibilité du contrat
 */
export const getContractAvailableTemplate = (nom: string, numeroContrat: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <style>
            .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            .header { background-color: #E53E3E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; border: 1px solid #e1e1e1; border-top: none; background-color: #fff; line-height: 1.6; }
            .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #E53E3E; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
            .info-box { background-color: #f7fafc; border-left: 4px solid #E53E3E; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SAARCIFLEX</h1>
            </div>
            <div class="content">
                <h2>Bonjour ${nom},</h2>
                <p>Nous avons le plaisir de vous informer que votre contrat d'assurance est désormais disponible dans votre espace client.</p>
                
                <div class="info-box">
                    <strong>Référence du contrat :</strong> ${numeroContrat}
                </div>

                <p>Vous pouvez dès à présent le consulter et le télécharger en vous connectant à votre compte SAARCIFLEX.</p>
                
                <p>Merci de votre confiance.</p>
                <p>L'équipe SAAR Assurances CI</p>
            </div>
            <div class="footer">
                <p>© 2025 SAARCIFLEX - Tous droits réservés</p>
                <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
