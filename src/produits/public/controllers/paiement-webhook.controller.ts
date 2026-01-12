import { Controller, Post, Body, Param, HttpStatus, HttpCode, Logger, NotFoundException, BadRequestException, Req, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaiementService } from '../../services/paiement.service';
import { SouscriptionService } from '../../services/souscription.service';
import { StatutPaiement } from '../../entities/paiement.entity';

/**
 * Contrôleur des webhooks de paiement
 * Reçoit les callbacks des agrégateurs de paiement
 */
@SkipThrottle()
@ApiTags('Webhooks Paiement')
@Controller('webhooks/paiement')
export class PaiementWebhookController {
    private readonly logger = new Logger(PaiementWebhookController.name);

    constructor(
        private readonly paiementService: PaiementService,
        private readonly souscriptionService: SouscriptionService,
    ) { }

    /**
     * Webhook générique pour tous les agrégateurs
     */
    @Post(':aggregateur')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Webhook de callback de paiement',
        description: 'Reçoit les notifications de paiement des agrégateurs (CinetPay, Wave, Orange Money, etc.)'
    })
    @ApiParam({
        name: 'aggregateur',
        description: 'Nom de l\'agrégateur de paiement',
        example: 'cinetpay',
        enum: ['cinetpay', 'wave', 'orange_money', 'autre']
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Webhook traité avec succès'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Données de callback invalides'
    })
    async recevoirCallbackPaiement(
        @Param('aggregateur') aggregateur: string,
        @Body() callbackData: any,
        @Query() queryParams: any,
        @Req() req: Request,
    ) {

        const allData = {
            ...callbackData,
            ...queryParams,
            ...(req.body || {}),
        };

        // Logger toutes les données reçues pour déboguer
        this.logger.log(`Callback reçu de ${aggregateur}`);
        this.logger.debug(`Body: ${JSON.stringify(callbackData)}`);
        this.logger.debug(`Query: ${JSON.stringify(queryParams)}`);
        this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
        this.logger.debug(`Données combinées: ${JSON.stringify(allData)}`);

        // Si aucune donnée n'est reçue
        if (!callbackData && !queryParams && Object.keys(allData).length === 0) {
            this.logger.error('Aucune donnée reçue dans le callback');
            throw new NotFoundException('Aucune donnée reçue dans le callback');
        }

        try {
            // Utiliser les données combinées
            const donneesAdaptees = this.adapterCallbackAgregateur(aggregateur, allData);

            // si on n'a pas la reference_paiement, chercher par transaction_id
            let referencePaiement = donneesAdaptees.reference_paiement;
            if (aggregateur.toLowerCase() === 'cinetpay' && !referencePaiement && donneesAdaptees.reference_externe) {
                const paiementParTransaction = await this.paiementService.obtenirPaiementParTransactionId(donneesAdaptees.reference_externe);
                if (paiementParTransaction) {
                    referencePaiement = paiementParTransaction.reference_paiement;
                    this.logger.log(`Paiement trouvé via transaction_id: ${referencePaiement}`);
                } else {
                    this.logger.warn(`Paiement non trouvé pour transaction_id: ${donneesAdaptees.reference_externe}`);
                    throw new NotFoundException(`Paiement non trouvé pour la transaction ${donneesAdaptees.reference_externe}`);
                }
            }


            const paiement = await this.paiementService.traiterCallbackPaiement(
                referencePaiement,
                allData,
                donneesAdaptees.statut,
                donneesAdaptees.reference_externe,
                donneesAdaptees.message_erreur
            );

            if (donneesAdaptees.statut === StatutPaiement.REUSSI) {
                await this.souscriptionService.finaliserSouscription(
                    paiement.devis_simule_id,
                    paiement.reference_paiement
                );
                this.logger.log(`Souscription finalisée pour le devis ${paiement.devis_simule_id}`);
            } else if (donneesAdaptees.statut === StatutPaiement.ECHOUE) {
                await this.souscriptionService.annulerSouscription(paiement.devis_simule_id);
                this.logger.warn(`Souscription annulée pour le devis ${paiement.devis_simule_id}`);
            }

            return {
                success: true,
                message: 'Callback traité avec succès'
            };
        } catch (error) {
            this.logger.error(`Erreur lors du traitement du callback: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Adapte les données du callback selon l'agrégateur
     */
    private adapterCallbackAgregateur(aggregateur: string, callbackData: any): {
        reference_paiement: string;
        statut: StatutPaiement;
        reference_externe?: string;
        message_erreur?: string;
        devis_id?: string;
    } {

        switch (aggregateur.toLowerCase()) {
            case 'cinetpay':
                return this.adapterCallbackCinetPay(callbackData);

            case 'wave':
                return this.adapterCallbackWave(callbackData);

            case 'orange_money':
                return this.adapterCallbackOrangeMoney(callbackData);

            default:

                return {
                    reference_paiement: callbackData.reference_paiement || callbackData.reference,
                    statut: this.mapperStatut(callbackData.statut || callbackData.status),
                    reference_externe: callbackData.reference_externe || callbackData.transaction_id,
                    message_erreur: callbackData.message_erreur || callbackData.error_message
                };
        }
    }

    /**
     * Adapte les callbacks de Wave
     */
    private adapterCallbackWave(callbackData: any) {
        return {
            reference_paiement: callbackData.merchant_reference || callbackData.reference_paiement,
            statut: callbackData.status === 'success' ? StatutPaiement.REUSSI : StatutPaiement.ECHOUE,
            reference_externe: callbackData.wave_id || callbackData.transaction_id,
            message_erreur: callbackData.error_message
        };
    }

    /**
     * Adapte les callbacks d'Orange Money
     */
    private adapterCallbackOrangeMoney(callbackData: any) {
        return {
            reference_paiement: callbackData.order_id || callbackData.reference_paiement,
            statut: callbackData.status === 'SUCCESS' ? StatutPaiement.REUSSI : StatutPaiement.ECHOUE,
            reference_externe: callbackData.txn_id || callbackData.transaction_id,
            message_erreur: callbackData.error
        };
    }

    /**
     * Adapte les callbacks de CinetPay
     * Format CinetPay: { code, message, data: { transaction_id, status, operator_id, ... }, metadata }
     */
    private adapterCallbackCinetPay(callbackData: any) {
        // Vérifier que callbackData existe
        if (!callbackData) {
            this.logger.error('callbackData est undefined dans adapterCallbackCinetPay');
            throw new BadRequestException('Données de callback invalides');
        }

        this.logger.debug(`Traitement callback CinetPay: ${JSON.stringify(callbackData)}`);

        // Extraire la référence de paiement depuis les métadonnées ou cpm_custom si disponible
        let referencePaiement: string | undefined;
        let devisId: string | undefined;
        let beneficiaires: Array<{ nom_complet: string; lien_souscripteur: string; ordre: number }> | undefined;
        try {
            if (callbackData.metadata) {
                const metadata = typeof callbackData.metadata === 'string'
                    ? JSON.parse(callbackData.metadata)
                    : callbackData.metadata;
                referencePaiement = metadata.reference_paiement ?? referencePaiement;
                devisId = metadata.devis_id ?? devisId;
                beneficiaires = metadata.beneficiaires ?? beneficiaires;
            }
        } catch (e) {
            this.logger.warn(`Impossible de parser les métadonnées CinetPay: ${e.message}`);
        }

        if ((!referencePaiement || !devisId) && callbackData.cpm_custom) {
            try {
                const custom = typeof callbackData.cpm_custom === 'string'
                    ? JSON.parse(callbackData.cpm_custom)
                    : callbackData.cpm_custom;
                referencePaiement = custom.reference_paiement ?? referencePaiement;
                devisId = custom.devis_id ?? devisId;
                beneficiaires = custom.beneficiaires ?? beneficiaires;
            } catch (e) {
                this.logger.warn(`Impossible de parser cpm_custom CinetPay: ${e.message}`);
            }
        }

        const transactionId = callbackData.transaction_id ||
            callbackData.data?.transaction_id ||
            callbackData.cpm_trans_id ||
            callbackData.cpm_transaction_id;

        // Code "00" = succès, autres codes = échec
        const code = callbackData.code || callbackData.data?.code || callbackData.status;
        const statusData = callbackData.data?.status || callbackData.status;
        const errorMessage = (callbackData.cpm_error_message || callbackData.error_message || '').toString().toUpperCase();
        const isSuccess = code === '00' ||
            code === 'ACCEPTED' ||
            statusData === 'ACCEPTED' ||
            statusData === 'SUCCESS' ||
            errorMessage === 'SUCCES' ||
            errorMessage === 'SUCCESS';

        return {
            reference_paiement: referencePaiement || transactionId || callbackData.reference_paiement,
            statut: isSuccess ? StatutPaiement.REUSSI : StatutPaiement.ECHOUE,
            reference_externe: transactionId,
            message_erreur: isSuccess ? null : (callbackData.message || callbackData.data?.message || 'Paiement échoué'),
            devis_id: devisId,
            // On renvoie les bénéficiaires éventuels pour enrichir le callback
            ...(beneficiaires ? { beneficiaires } : {}),
        };
    }

    /**
     * Mappe le statut générique vers StatutPaiement
     */
    private mapperStatut(statut: string): StatutPaiement {
        const statutLower = statut?.toLowerCase();

        if (['success', 'completed', 'paid', 'successful'].includes(statutLower)) {
            return StatutPaiement.REUSSI;
        }

        if (['failed', 'error', 'rejected', 'declined'].includes(statutLower)) {
            return StatutPaiement.ECHOUE;
        }

        if (['pending', 'processing'].includes(statutLower)) {
            return StatutPaiement.EN_ATTENTE;
        }

        if (['cancelled', 'canceled'].includes(statutLower)) {
            return StatutPaiement.ANNULE;
        }

        return StatutPaiement.ECHOUE;
    }
}

