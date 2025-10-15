import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrat, StatutContrat } from '../entities/contrat.entity';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';
import { Produit, TypeProduit, PeriodicitePrime } from '../entities/produit.entity';

/**
 * Service de gestion des contrats d'assurance
 */
@Injectable()
export class ContratService {
    constructor(
        @InjectRepository(Contrat)
        private readonly contratRepository: Repository<Contrat>,
        @InjectRepository(DevisSimule)
        private readonly devisSimuleRepository: Repository<DevisSimule>,
        @InjectRepository(Produit)
        private readonly produitRepository: Repository<Produit>,
    ) { }

    /**
     * Crée un contrat à partir d'un devis payé
     */
    async creerContratDepuisDevis(devisId: string): Promise<Contrat> {
        const devis = await this.devisSimuleRepository.findOne({
            where: { id: devisId, statut: StatutDevis.PAYE },
            relations: ['produit', 'grilleTarifaire']
        });

        if (!devis) {
            throw new NotFoundException('Devis payé non trouvé');
        }

        const contratExistant = await this.contratRepository.findOne({
            where: { devis_simule_id: devisId }
        });

        if (contratExistant) {
            return contratExistant;
        }

        const numeroContrat = await this.genererNumeroContrat(devis.produit.type);

        const dateDebutCouverture = new Date();
        const dateFinCouverture = new Date();
        dateFinCouverture.setMonth(dateFinCouverture.getMonth() + 12);

        // Créer le contrat
        const contrat = this.contratRepository.create({
            numero_contrat: numeroContrat,
            devis_simule_id: devisId,
            produit_id: devis.produit_id,
            grille_tarifaire_id: devis.grille_tarifaire_id,
            utilisateur_id: devis.utilisateur_id,
            criteres_utilisateur: devis.criteres_utilisateur,
            prime_mensuelle: devis.prime_calculee,
            franchise: devis.franchise_calculee,
            plafond: devis.plafond_calcule,
            periodicite_paiement: devis.produit.periodicite_prime,
            duree_couverture: 12,
            date_debut_couverture: dateDebutCouverture,
            date_fin_couverture: dateFinCouverture,
            statut: StatutContrat.ACTIF,
            informations_assure: devis.informations_assure,
            assure_est_souscripteur: devis.assure_est_souscripteur,
            chemin_recto_assure: devis.chemin_recto_assure,
            chemin_verso_assure: devis.chemin_verso_assure,
        });

        const contratSauvegarde = await this.contratRepository.save(contrat);

        // Mettre à jour le statut du devis
        await this.devisSimuleRepository.update(
            { id: devisId },
            { statut: StatutDevis.CONVERTI_EN_CONTRAT }
        );

        return contratSauvegarde;
    }

    /**
     * Génère un numéro de contrat unique avec préfixe par type
     * Format: VIE-2025-000001 ou NONVIE-2025-000001
     */
    private async genererNumeroContrat(typeProduit: TypeProduit): Promise<string> {
        const annee = new Date().getFullYear();
        const prefixe = typeProduit === TypeProduit.VIE ? 'VIE' : 'NONVIE';

        // On récupère le dernier contrat du même type pour cette année
        const dernierContrat = await this.contratRepository
            .createQueryBuilder('contrat')
            .where('contrat.numero_contrat LIKE :prefixe', { prefixe: `${prefixe}-${annee}-%` })
            .orderBy('contrat.created_at', 'DESC')
            .getOne();

        let numeroSequence = 1;

        if (dernierContrat) {
            const parts = dernierContrat.numero_contrat.split('-');
            const dernierNumero = parseInt(parts[2], 10);
            numeroSequence = dernierNumero + 1;
        }

        const numeroFormate = numeroSequence.toString().padStart(6, '0');

        return `${prefixe}-${annee}-${numeroFormate}`;
    }

    /**
     * Récupère un contrat par son ID
     */
    async obtenirContratParId(contratId: string, utilisateurId?: string): Promise<Contrat> {
        const whereClause: any = { id: contratId };

        if (utilisateurId) {
            whereClause.utilisateur_id = utilisateurId;
        }

        const contrat = await this.contratRepository.findOne({
            where: whereClause,
            relations: ['produit', 'grilleTarifaire', 'beneficiaires', 'devisSimule']
        });

        if (!contrat) {
            throw new NotFoundException('Contrat non trouvé');
        }

        return contrat;
    }

    /**
     * Récupère un contrat par son numéro
     */
    async obtenirContratParNumero(numeroContrat: string): Promise<Contrat> {
        const contrat = await this.contratRepository.findOne({
            where: { numero_contrat: numeroContrat },
            relations: ['produit', 'grilleTarifaire', 'beneficiaires', 'devisSimule']
        });

        if (!contrat) {
            throw new NotFoundException('Contrat non trouvé');
        }

        return contrat;
    }

    /**
     * Récupère tous les contrats d'un utilisateur
     */
    async obtenirContratsUtilisateur(utilisateurId: string): Promise<Contrat[]> {
        return await this.contratRepository.find({
            where: { utilisateur_id: utilisateurId },
            relations: ['produit', 'beneficiaires'],
            order: { created_at: 'DESC' }
        });
    }

    /**
     * Met à jour le statut d'un contrat
     */
    async mettreAJourStatutContrat(contratId: string, nouveauStatut: StatutContrat): Promise<Contrat> {
        const contrat = await this.obtenirContratParId(contratId);

        contrat.statut = nouveauStatut;

        return await this.contratRepository.save(contrat);
    }

    /**
     * Résilier un contrat
     */
    async resilierContrat(contratId: string, utilisateurId: string): Promise<Contrat> {
        const contrat = await this.obtenirContratParId(contratId, utilisateurId);

        if (contrat.statut === StatutContrat.RESILIE) {
            throw new BadRequestException('Le contrat est déjà résilié');
        }

        return await this.mettreAJourStatutContrat(contratId, StatutContrat.RESILIE);
    }

    /**
     * Suspendre un contrat
     */
    async suspendreContrat(contratId: string, utilisateurId: string): Promise<Contrat> {
        const contrat = await this.obtenirContratParId(contratId, utilisateurId);

        if (contrat.statut !== StatutContrat.ACTIF) {
            throw new BadRequestException('Seuls les contrats actifs peuvent être suspendus');
        }

        return await this.mettreAJourStatutContrat(contratId, StatutContrat.SUSPENDU);
    }

    /**
     * Réactiver un contrat suspendu
     */
    async reactiverContrat(contratId: string, utilisateurId: string): Promise<Contrat> {
        const contrat = await this.obtenirContratParId(contratId, utilisateurId);

        if (contrat.statut !== StatutContrat.SUSPENDU) {
            throw new BadRequestException('Seuls les contrats suspendus peuvent être réactivés');
        }

        return await this.mettreAJourStatutContrat(contratId, StatutContrat.ACTIF);
    }
}

