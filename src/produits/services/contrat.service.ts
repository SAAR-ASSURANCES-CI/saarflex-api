import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrat, StatutContrat } from '../entities/contrat.entity';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';
import { Produit, TypeProduit, PeriodicitePrime } from '../entities/produit.entity';
import { CategorieProduit } from '../entities/categorie-produit.entity';
import { ConfigurationService } from '../../config/services/configuration.service';

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
        @InjectRepository(CategorieProduit)
        private readonly categorieRepository: Repository<CategorieProduit>,
        private readonly configurationService: ConfigurationService,
    ) { }

    /**
     * Crée un contrat à partir d'un devis payé
     */
    async creerContratDepuisDevis(devisId: string): Promise<Contrat> {
        const devis = await this.devisSimuleRepository.findOne({
            where: { id: devisId, statut: StatutDevis.PAYE },
            relations: ['produit', 'categorie', 'grilleTarifaire']
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

        // Récupérer la catégorie (soit depuis le devis, soit depuis le produit)
        let categorie: CategorieProduit | null | undefined = devis.categorie;

        if (!categorie && devis.produit) {
            const produitComplet = await this.produitRepository.findOne({
                where: { id: devis.produit.id },
                relations: ['categorie']
            });
            categorie = produitComplet?.categorie;
        }

        if (!categorie) {
            throw new BadRequestException('Le devis doit avoir une catégorie pour générer un numéro de police (non trouvée sur le devis ni sur le produit)');
        }

        const numeroContrat = await this.genererNumeroContrat(
            devis.produit.type,
            categorie.code
        );

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

        await this.devisSimuleRepository.update(
            { id: devisId },
            { statut: StatutDevis.CONVERTI_EN_CONTRAT }
        );

        return contratSauvegarde;
    }

    /**
     * Génère un numéro de contrat unique selon le nouveau format
     * Format: {CODE_AGENCE}-{CODE_CATEGORIE}{SEQUENCE}
     * Exemple: 101-23000001
     * 
     * - CODE_AGENCE: 3 chiffres (configurable, ex: 101)
     * - CODE_CATEGORIE: 3 chiffres (ex: 230)
     * - SEQUENCE: 5 chiffres (ex: 00001)
     * 
     * La séquence est indépendante par catégorie ET par type de produit (VIE/NON-VIE)
     */
    private async genererNumeroContrat(typeProduit: TypeProduit, codeCategorie: string): Promise<string> {
        const codeAgence = await this.configurationService.getCodeAgence();

        const codeCategorieNumeric = codeCategorie.replace(/\D/g, '');
        if (codeCategorieNumeric.length < 3) {
            throw new BadRequestException(`Le code catégorie "${codeCategorie}" doit contenir au moins 3 chiffres`);
        }

        const codeCategorieFormate = codeCategorieNumeric.substring(0, 3);

        const prefixeRecherche = `${codeAgence}-${codeCategorieFormate}`;

        const dernierContrat = await this.contratRepository
            .createQueryBuilder('contrat')
            .leftJoinAndSelect('contrat.produit', 'produit')
            .where('contrat.numero_contrat LIKE :prefixe', { prefixe: `${prefixeRecherche}%` })
            .andWhere('produit.type = :type', { type: typeProduit })
            .orderBy('contrat.created_at', 'DESC')
            .getOne();

        let numeroSequence = 1;

        if (dernierContrat) {
            const partieApresCodeCategorie = dernierContrat.numero_contrat.substring(prefixeRecherche.length);
            const dernierNumero = parseInt(partieApresCodeCategorie, 10);

            if (!isNaN(dernierNumero)) {
                numeroSequence = dernierNumero + 1;
            }
        }

        const sequenceFormatee = numeroSequence.toString().padStart(5, '0');

        return `${codeAgence}-${codeCategorieFormate}${sequenceFormatee}`;
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

