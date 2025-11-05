import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration CinetPay
 * Gère les variables d'environnement pour l'intégration CinetPay
 */
@Injectable()
export class CinetPayConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Clé API CinetPay
   */
  get apikey(): string {
    return this.configService.get<string>('CINETPAY_API_KEY') || '97814879868ff3c14ade8f2.88189786';
  }

  /**
   * Site ID CinetPay
   */
  get siteId(): string {
    return this.configService.get<string>('CINETPAY_SITE_ID') || '105906917';
  }

  /**
   * URL de notification pour les webhooks
   */
  get notifyUrl(): string {
    return this.configService.get<string>('CINETPAY_NOTIFY_URL') || 'https://72c566e6d9d4.ngrok-free.app/webhooks/paiement/cinetpay';
  }

  /**
   * URL de retour après paiement
   */
  get returnUrl(): string {
    return this.configService.get<string>('CINETPAY_RETURN_URL') || 'https://saarassurancesci.com/';
  }

  /**
   * URL de l'API CinetPay
   */
  get apiUrl(): string {
    return this.configService.get<string>('CINETPAY_API_URL', 'https://api-checkout.cinetpay.com/v2/payment');
  }

  /**
   * Vérifie si la configuration est valide
   */
  isValid(): boolean {
    return !!(this.apikey && this.siteId && this.notifyUrl && this.returnUrl);
  }
}

