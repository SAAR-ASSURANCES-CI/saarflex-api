import { Controller, Post, Body, Param, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaiementService } from '../../services/paiement.service';
import { SouscriptionService } from '../../services/souscription.service';
import { CallbackPaiementDto } from '../../dto/souscription.dto';
import { StatutPaiement } from '../../entities/paiement.entity';

/**
 * Contrôleur des webhooks de paiement
 * Reçoit les callbacks des agrégateurs de paiement
 */
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
        description: 'Reçoit les notifications de paiement des agrégateurs (Wave, Orange Money, etc.)'
    })
    @ApiParam({
        name: 'aggregateur',
        description: 'Nom de l\'agrégateur de paiement',
        example: 'wave',
        enum: ['wave', 'orange_money', 'autre']
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
    ) {
        this.logger.log(`Callback reçu de ${aggregateur}: ${JSON.stringify(callbackData)}`);

        try {
            
            const donneesAdaptees = this.adapterCallbackAgregateur(aggregateur, callbackData);

            
            const paiement = await this.paiementService.traiterCallbackPaiement(
                donneesAdaptees.reference_paiement,
                callbackData,
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
    } {
        
        switch (aggregateur.toLowerCase()) {
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

