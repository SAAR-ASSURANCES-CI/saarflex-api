import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paiement, StatutPaiement, MethodePaiement } from '../entities/paiement.entity';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';
import { CinetPayService } from './cinetpay.service';

/**
 * Service de gestion des paiements
 * Abstraction pour gérer différents agrégateurs de paiement
 */
@Injectable()
export class PaiementService {
    private readonly logger = new Logger(PaiementService.name);

    constructor(
        @InjectRepository(Paiement)
        private readonly paiementRepository: Repository<Paiement>,
        @InjectRepository(DevisSimule)
        private readonly devisSimuleRepository: Repository<DevisSimule>,
        private readonly cinetPayService: CinetPayService,
    ) { }

    /**
     * Initie un paiement pour un devis
     */
    async initierPaiement(
        devisId: string,
        utilisateurId: string,
        montant: number,
        methodePaiement: MethodePaiement,
        numeroTelephone?: string,
        currency: string = 'XOF'
    ): Promise<Paiement> {

        const devis = await this.devisSimuleRepository.findOne({
            where: { id: devisId, utilisateur_id: utilisateurId }
        });

        if (!devis) {
            throw new NotFoundException('Devis non trouvé');
        }

        const referencePaiement = this.genererReferencePaiement();

        // Générer un transaction_id unique pour CinetPay 
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

        // Mapper la méthode de paiement vers le channel CinetPay
        const channel = methodePaiement === MethodePaiement.MOBILE_MONEY ? 'MOBILE_MONEY' : 'WALLET';

        // Préparer les métadonnées pour retrouver le paiement dans les webhooks
        const metadata = JSON.stringify({ reference_paiement: referencePaiement, devis_id: devisId });

        // Initialiser le paiement avec CinetPay
        this.logger.log(`Initialisation paiement CinetPay - Devis: ${devisId}, Montant: ${montant} ${currency}, Channel: ${channel}`);

        try {
            const cinetPayResponse = await this.cinetPayService.initierPaiement(
                transactionId,
                montant,
                currency,
                `Paiement devis ${devisId}`,
                channel,
                metadata,
                numeroTelephone
            );

            const paiementData = {
                reference_paiement: referencePaiement,
                devis_simule_id: devisId,
                utilisateur_id: utilisateurId,
                montant,
                methode_paiement: methodePaiement,
                numero_telephone: numeroTelephone,
                statut: StatutPaiement.EN_ATTENTE,
                payment_token: cinetPayResponse.payment_token,
                payment_url: cinetPayResponse.payment_url,
                currency: currency,
                cinetpay_transaction_id: cinetPayResponse.transaction_id,
                reference_externe: cinetPayResponse.transaction_id,
                donnees_callback: {
                    initialisation: {
                        payment_token: cinetPayResponse.payment_token,
                        payment_url: cinetPayResponse.payment_url,
                        transaction_id: cinetPayResponse.transaction_id,
                    }
                }
            };

            const paiement = this.paiementRepository.create(paiementData);
            const paiementSauvegarde = await this.paiementRepository.save(paiement);

            await this.devisSimuleRepository.update(
                { id: devisId },
                { statut: StatutDevis.EN_ATTENTE_PAIEMENT }
            );

            this.logger.log(`Paiement initié avec succès - Reference: ${referencePaiement}, Payment URL: ${cinetPayResponse.payment_url}`);

            return paiementSauvegarde;
        } catch (error) {
            this.logger.error(`Erreur lors de l'initialisation du paiement CinetPay: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Traite le callback d'un agrégateur de paiement
     */
    async traiterCallbackPaiement(
        referencePaiement: string,
        donneesCallback: Record<string, any>,
        statut: StatutPaiement,
        referenceExterne?: string,
        messageErreur?: string
    ): Promise<Paiement> {
        const paiement = await this.paiementRepository.findOne({
            where: { reference_paiement: referencePaiement },
            relations: ['devisSimule']
        });

        if (!paiement) {
            throw new NotFoundException('Paiement non trouvé');
        }

        paiement.statut = statut;

        const previousCallback = paiement.donnees_callback ?? {};
        const previousBeneficiaires = previousCallback?.beneficiaires;

        const mergedCallback: Record<string, any> = {
            ...previousCallback,
            dernier_callback: donneesCallback,
        };

        if (previousCallback?.initialisation && !mergedCallback.initialisation) {
            mergedCallback.initialisation = previousCallback.initialisation;
        }

        if (donneesCallback?.beneficiaires) {
            mergedCallback.beneficiaires = donneesCallback.beneficiaires;
        } else if (previousBeneficiaires) {
            mergedCallback.beneficiaires = previousBeneficiaires;
        }

        paiement.donnees_callback = mergedCallback;
        paiement.reference_externe = referenceExterne || paiement.reference_externe;
        paiement.message_erreur = messageErreur || null;

        if (referenceExterne && !paiement.cinetpay_transaction_id) {
            paiement.cinetpay_transaction_id = referenceExterne;
        }

        if (donneesCallback?.data?.operator_id || donneesCallback?.operator_id) {
            paiement.operator_id = donneesCallback.data?.operator_id || donneesCallback.operator_id;
        }

        if (statut === StatutPaiement.REUSSI) {
            paiement.date_paiement = new Date();

            await this.devisSimuleRepository.update(
                { id: paiement.devis_simule_id },
                { statut: StatutDevis.PAYE }
            );
        } else if (statut === StatutPaiement.ECHOUE) {
            await this.devisSimuleRepository.update(
                { id: paiement.devis_simule_id },
                { statut: StatutDevis.SAUVEGARDE }
            );
        }

        return await this.paiementRepository.save(paiement);
    }

    /**
     * Lie un contrat à un paiement
     */
    async lierContrat(paiementId: string, contratId: string): Promise<void> {
        await this.paiementRepository.update(paiementId, { contrat_id: contratId });
    }

    /**
     * Récupère un paiement par sa référence
     */
    async obtenirPaiementParReference(reference: string): Promise<Paiement> {
        const paiement = await this.paiementRepository.findOne({
            where: { reference_paiement: reference },
            relations: ['devisSimule', 'contrat']
        });

        if (!paiement) {
            throw new NotFoundException('Paiement non trouvé');
        }

        return paiement;
    }

    /**
     * Récupère un paiement par transaction_id CinetPay (reference_externe ou cinetpay_transaction_id)
     */
    async obtenirPaiementParTransactionId(transactionId: string): Promise<Paiement | null> {
        const paiement = await this.paiementRepository.findOne({
            where: [
                { reference_externe: transactionId },
                { cinetpay_transaction_id: transactionId }
            ],
            relations: ['devisSimule', 'contrat']
        });

        return paiement;
    }

    /**
     * Récupère les paiements d'un utilisateur
     */
    async obtenirPaiementsUtilisateur(utilisateurId: string): Promise<Paiement[]> {
        return await this.paiementRepository.find({
            where: { utilisateur_id: utilisateurId },
            order: { created_at: 'DESC' }
        });
    }

    /**
     * Génère une référence unique de paiement
     */
    private genererReferencePaiement(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PAY-${timestamp}-${random}`;
    }

    /**
     * Vérifie si un paiement est réussi
     */
    async paiementEstReussi(devisId: string): Promise<boolean> {
        const paiement = await this.paiementRepository.findOne({
            where: {
                devis_simule_id: devisId,
                statut: StatutPaiement.REUSSI
            }
        });

        return !!paiement;
    }
}

