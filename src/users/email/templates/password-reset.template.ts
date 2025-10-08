/**
 * Template HTML pour l'email de réinitialisation de mot de passe
 */
export function getPasswordResetTemplate(code: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Réinitialisation de votre mot de passe</h2>
        <p>Utilisez le code ci-dessous pour réinitialiser votre mot de passe. Ce code est valable 15 minutes.</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background: #f8f9fa; border: 1px solid #e9ecef; padding: 16px; text-align: center;">${code}</div>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      </div>`;
}

