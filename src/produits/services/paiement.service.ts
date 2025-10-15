import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paiement, StatutPaiement, MethodePaiement } from '../entities/paiement.entity';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';

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
    ) { }

    /**
     * Initie un paiement pour un devis
     */
    async initierPaiement(
        devisId: string,
        utilisateurId: string,
        montant: number,
        methodePaiement: MethodePaiement,
        numeroTelephone?: string
    ): Promise<Paiement> {

        const devis = await this.devisSimuleRepository.findOne({
            where: { id: devisId, utilisateur_id: utilisateurId }
        });

        if (!devis) {
            throw new NotFoundException('Devis non trouvé');
        }

        if (devis.statut !== StatutDevis.SAUVEGARDE) {
            throw new BadRequestException('Le devis doit être sauvegardé avant de pouvoir être payé');
        }

        const referencePaiement = this.genererReferencePaiement();

        const paiementData = {
            reference_paiement: referencePaiement,
            devis_simule_id: devisId,
            utilisateur_id: utilisateurId,
            montant,
            methode_paiement: methodePaiement,
            numero_telephone: numeroTelephone,
            statut: StatutPaiement.EN_ATTENTE,
        };

        const paiement = this.paiementRepository.create(paiementData);

        const paiementSauvegarde = await this.paiementRepository.save(paiement);

        await this.devisSimuleRepository.update(
            { id: devisId },
            { statut: StatutDevis.EN_ATTENTE_PAIEMENT }
        );

        // TODO: Appeler l'API de l'agrégateur de paiement selon la méthode

        return paiementSauvegarde;
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
        paiement.donnees_callback = donneesCallback;
        paiement.reference_externe = referenceExterne || null;
        paiement.message_erreur = messageErreur || null;

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

