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
    return this.configService.get<string>('CINETPAY_API_KEY') || '';
  }

  /**
   * Site ID CinetPay
   */
  get siteId(): string {
    return this.configService.get<string>('CINETPAY_SITE_ID') || '';
  }

  /**
   * URL de notification pour les webhooks
   */
  get notifyUrl(): string {
    return this.configService.get<string>('CINETPAY_NOTIFY_URL') || '';
  }

  /**
   * URL de retour après paiement
   */
  get returnUrl(): string {
    return this.configService.get<string>('CINETPAY_RETURN_URL') || '';
  }

  /**
   * URL de l'API CinetPay
   */
  get apiUrl(): string {
    return this.configService.get<string>('CINETPAY_API_URL', '');
  }

  /**
   * Vérifie si la configuration est valide
   */
  isValid(): boolean {
    return !!(this.apikey && this.siteId && this.notifyUrl && this.returnUrl);
  }
}

