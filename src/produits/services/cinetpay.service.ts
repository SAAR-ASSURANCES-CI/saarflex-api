import { Injectable, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CinetPayConfig } from '../config/cinetpay.config';
import { InitierPaiementCinetPayDto, CinetPayInitResponseDto } from '../dto/cinetpay.dto';

/**
 * Service d'intégration CinetPay
 * Gère les appels API vers CinetPay
 */
@Injectable()
export class CinetPayService {
    private readonly logger = new Logger(CinetPayService.name);
    private readonly config: CinetPayConfig;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.config = new CinetPayConfig(configService);

        this.logger.debug(`CinetPay config initialisée - API URL: ${this.config.apiUrl}`);
        if (!this.config.isValid()) {
            this.logger.warn('Configuration CinetPay incomplète. Vérifiez les variables d\'environnement.');
        }
    }

    /**
     * Initie un paiement via CinetPay
     * @param transactionId Identifiant unique de la transaction
     * @param amount Montant 
     * @param currency Devise (XOF, XAF)
     * @param description Description du paiement
     * @param channels Canal de paiement (MOBILE_MONEY, WALLET)
     * @param metadata Métadonnées
     * @param customerPhoneNumber Numéro de téléphone du client 
     * @returns Réponse avec payment_token et payment_url
     */
    async initierPaiement(
        transactionId: string,
        amount: number,
        currency: string,
        description: string,
        channels: string,
        metadata?: string,
        customerPhoneNumber?: string,
        customerInfo?: {
            customer_id?: string;
            customer_name?: string;
            customer_surname?: string;
            customer_email?: string;
            customer_address?: string;
            customer_city?: string;
            customer_country?: string;
            customer_state?: string;
            customer_zip_code?: string;
        }
    ): Promise<{ payment_token: string; payment_url: string; transaction_id: string }> {
        this.logger.log(`Initialisation paiement CinetPay - Transaction ID: ${transactionId}, Montant: ${amount} ${currency}`);

        // Validation de la configuration
        if (!this.config.isValid()) {
            throw new BadRequestException('Configuration CinetPay incomplète. Vérifiez les variables d\'environnement.');
        }


        let montantFinal = amount;
        if (currency !== 'USD') {
            montantFinal = Math.round(amount / 5) * 5;
            if (montantFinal === 0) {
                montantFinal = 5; // Minimum 5
            }
            this.logger.debug(`Montant arrondi de ${amount} à ${montantFinal} pour correspondre aux exigences CinetPay`);
        }

        // Validation du transaction_id 
        if (!/^[a-zA-Z0-9-]+$/.test(transactionId)) {
            throw new BadRequestException('L\'identifiant de transaction ne doit pas contenir de caractères spéciaux (#,/,$,_,&)');
        }

        // Préparer les données de la requête
        const requestData: any = {
            apikey: this.config.apikey,
            site_id: this.config.siteId,
            transaction_id: transactionId,
            amount: Math.round(montantFinal),
            currency: currency.toUpperCase(),
            description: description.replace(/[#/$_&]/g, ''),
            notify_url: this.config.notifyUrl,
            return_url: this.config.returnUrl,
            channels: channels,
            lang: 'fr',
            metadata: metadata,
        };

        // Ajouter le numéro de téléphone si fourni
        if (customerPhoneNumber) {
            requestData.customer_phone_number = customerPhoneNumber;
            requestData.lock_phone_number = false;
        }

        if (customerInfo) {
            if (customerInfo.customer_id) requestData.customer_id = customerInfo.customer_id;
            if (customerInfo.customer_name) requestData.customer_name = customerInfo.customer_name;
            if (customerInfo.customer_surname) requestData.customer_surname = customerInfo.customer_surname;
            if (customerInfo.customer_email) requestData.customer_email = customerInfo.customer_email;
            if (customerInfo.customer_address) requestData.customer_address = customerInfo.customer_address;
            if (customerInfo.customer_city) requestData.customer_city = customerInfo.customer_city;
            if (customerInfo.customer_country) requestData.customer_country = customerInfo.customer_country;
            if (customerInfo.customer_state) requestData.customer_state = customerInfo.customer_state;
            if (customerInfo.customer_zip_code) requestData.customer_zip_code = customerInfo.customer_zip_code;
        }

        try {
            this.logger.debug(`Envoi requête CinetPay: ${JSON.stringify({ ...requestData, apikey: '***', site_id: '***' })}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Saarflex-API/1.0',
                },
                body: JSON.stringify(requestData),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const responseData: CinetPayInitResponseDto = await response.json();

            // Logger la réponse complète pour déboguer
            this.logger.log(`=== Réponse CinetPay ===`);
            this.logger.log(`Code: ${responseData.code}`);
            this.logger.log(`Message: ${responseData.message}`);
            this.logger.log(`Données complètes: ${JSON.stringify(responseData, null, 2)}`);
            this.logger.log(`================================`);

            // Vérifier le code de réponse
            if (responseData.code !== '201' && responseData.code !== '00') {
                const errorMessage = this.mapCinetPayError(responseData.code, responseData.message);
                this.logger.error(`Erreur CinetPay - Code: ${responseData.code}, Message: ${responseData.message}`);
                throw new BadRequestException(errorMessage);
            }

            // Vérifier que les données sont présentes
            if (!responseData.data || !responseData.data.payment_token || !responseData.data.payment_url) {
                this.logger.error(`Réponse CinetPay invalide: ${JSON.stringify(responseData)}`);
                throw new BadRequestException('Réponse invalide de CinetPay: données de paiement manquantes');
            }

            return {
                payment_token: responseData.data.payment_token,
                payment_url: responseData.data.payment_url,
                transaction_id: responseData.data.transaction_id || transactionId,
            };
        } catch (error) {
            this.logger.error(`Erreur lors de l'initialisation du paiement CinetPay: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error.name === 'AbortError') {
                this.logger.error('Timeout lors de l\'appel à CinetPay');
                throw new HttpException('Timeout lors de l\'appel à CinetPay', HttpStatus.REQUEST_TIMEOUT);
            }

            // Erreur réseau ou autre
            this.logger.error('Erreur lors de l\'appel à CinetPay');
            throw new HttpException('Impossible de contacter le serveur CinetPay', HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    /**
     * Mappe les codes d'erreur CinetPay vers des messages utilisateur
     */
    private mapCinetPayError(code: string, message?: string): string {

        const errorMap: Record<string, string> = {
            '608': 'Paramètre obligatoire manquant ou invalide. Vérifiez le format de votre requête.',
            '609': 'Clé API incorrecte. Vérifiez votre configuration.',
            '613': 'Site ID incorrect. Vérifiez votre configuration.',
            '624': 'Erreur lors du traitement de la requête. Vérifiez vos paramètres.',
            '429': 'Trop de requêtes. Veuillez patienter avant de réessayer.',
            '403': 'Format de requête incorrect. Utilisez le format JSON.',
            '1010': 'Erreur de restriction. Vérifiez votre configuration serveur.',
        };

        const defaultMessage = message || 'Erreur lors de l\'initialisation du paiement';

        return errorMap[code] || `${defaultMessage} (Code: ${code})`;
    }

    /**
     * Vérifie le statut d'une transaction CinetPay
     * @param transactionId Identifiant de la transaction
     * @returns Statut de la transaction
     */
    async verifierStatutTransaction(transactionId: string): Promise<any> {

        this.logger.log(`Vérification statut transaction: ${transactionId}`);

        // Cette méthode peut être implémentée si nécessaire pour vérifier le statut
        // via l'API de vérification de CinetPay
        // Pour l'instant, on utilise uniquement les webhooks

        throw new Error('Méthode non implémentée. Utilisez les webhooks pour vérifier le statut.');
    }
}

