import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';
import { Produit, TypeProduit } from '../entities/produit.entity';
import { GrilleTarifaire } from '../entities/grille-tarifaire.entity';
import { Profile } from '../../users/entities/profile.entity';
import { CreateSimulationDevisSimplifieeDto } from '../dto/simulation-devis-simplifie.dto';

const DUREE_VALIDITE_SIMULATION = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Service responsable de la création de devis simulés
 */
@Injectable()
export class DevisCreationService {
    private readonly logger = new Logger(DevisCreationService.name);

    constructor(
        @InjectRepository(DevisSimule)
        private readonly devisSimuleRepository: Repository<DevisSimule>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
    ) {}

    /**
     * Crée un devis simulé en base
     * @param simulationDto DTO de simulation
     * @param produit Produit
     * @param grilleTarifaire Grille tarifaire
     * @param primeCalculee Prime calculée
     * @param criteres Critères enrichis
     * @param utilisateurId ID utilisateur (optionnel)
     */
    async creerDevisSimule(
        simulationDto: CreateSimulationDevisSimplifieeDto,
        produit: Produit,
        grilleTarifaire: GrilleTarifaire,
        primeCalculee: number,
        criteres: Record<string, any>,
        utilisateurId?: string
    ): Promise<DevisSimule> {
        
        const informationsAssure = await this.construireInformationsAssure(
            simulationDto, 
            utilisateurId
        );
        
        const devisData = this.creerDevisData(
            simulationDto,
            produit,
            grilleTarifaire,
            primeCalculee,
            criteres,
            informationsAssure,
            utilisateurId
        );

        return await this.sauvegarderDevisAvecReference(devisData, produit);
    }

    /**
     * Construit les informations de l'assuré
     * @param simulationDto DTO de simulation
     * @param utilisateurId ID utilisateur
     */
    private async construireInformationsAssure(
        simulationDto: CreateSimulationDevisSimplifieeDto,
        utilisateurId?: string
    ): Promise<Record<string, any> | undefined> {
        
        if (simulationDto.assure_est_souscripteur && utilisateurId) {
            return await this.construireInformationsDepuisProfil(utilisateurId);
        } else if (!simulationDto.assure_est_souscripteur && simulationDto.informations_assure) {
            return simulationDto.informations_assure;
        }
        
        return undefined;
    }

    /**
     * Construit les informations depuis le profil utilisateur
     * @param utilisateurId ID utilisateur
     */
    private async construireInformationsDepuisProfil(
        utilisateurId: string
    ): Promise<Record<string, any> | undefined> {
        const profile = await this.profileRepository.findOne({
            where: { user_id: utilisateurId },
            relations: ['user']
        });
        
        if (!profile) {
            return undefined;
        }

        return {
            nom_complet: `${profile.user?.nom || ''}`.trim(),
            date_naissance: profile.date_naissance?.toString() || '',
            type_piece_identite: profile.type_piece_identite || '',
            numero_piece_identite: profile.numero_piece_identite || '',
            email: profile.user?.email || '',
            telephone: profile.user?.telephone || '',
            adresse: profile.adresse || ''
        };
    }

    /**
     * Crée l'objet de données du devis
     * @param simulationDto DTO de simulation
     * @param produit Produit
     * @param grilleTarifaire Grille tarifaire
     * @param primeCalculee Prime calculée
     * @param criteres Critères
     * @param informationsAssure Informations assuré
     * @param utilisateurId ID utilisateur
     */
    private creerDevisData(
        simulationDto: CreateSimulationDevisSimplifieeDto,
        produit: Produit,
        grilleTarifaire: GrilleTarifaire,
        primeCalculee: number,
        criteres: Record<string, any>,
        informationsAssure: Record<string, any> | undefined,
        utilisateurId?: string
    ): Partial<DevisSimule> {
        return {
            produit_id: simulationDto.produit_id,
            grille_tarifaire_id: grilleTarifaire.id,
            utilisateur_id: utilisateurId,
            criteres_utilisateur: criteres,
            prime_calculee: primeCalculee,
            franchise_calculee: 0,
            plafond_calcule: undefined,
            statut: StatutDevis.SIMULATION,
            expires_at: new Date(Date.now() + DUREE_VALIDITE_SIMULATION),
            assure_est_souscripteur: simulationDto.assure_est_souscripteur,
            informations_assure: informationsAssure
        };
    }

    /**
     * Sauvegarde le devis en générant une référence unique.
     * @param devisData Données du devis
     * @param produit Produit utilisé pour déterminer le préfixe
     */
    private async sauvegarderDevisAvecReference(
        devisData: Partial<DevisSimule>,
        produit: Produit
    ): Promise<DevisSimule> {
        let derniereErreur: unknown = null;

        for (let tentative = 1; tentative <= 5; tentative++) {
            const reference = await this.genererReference(produit);
            const devis = this.devisSimuleRepository.create({
                ...devisData,
                reference
            });

            try {
                const saved = await this.devisSimuleRepository.save(devis);
                this.logger.debug(
                    `Devis simulé créé avec la référence ${reference} (tentative ${tentative}).`
                );
                return saved;
            } catch (error) {
                if (this.isDuplicateReferenceError(error)) {
                    this.logger.warn(
                        `Référence ${reference} déjà utilisée (tentative ${tentative}). Nouvelle tentative en cours.`
                    );
                    derniereErreur = error;
                    continue;
                }

                throw error;
            }
        }

        this.logger.error(`Impossible de générer une référence unique après plusieurs tentatives.`);
        if (derniereErreur instanceof Error) {
            throw derniereErreur;
        }
        throw new Error('Impossible de générer une référence unique pour le devis simulé.');
    }

    /**
     * Génère la référence au format TYPE-YYYYMMDD-####
     * @param produit Produit pour déterminer le type (Vie / Non-Vie)
     */
    private async genererReference(produit: Produit): Promise<string> {
        const prefix = produit.type === TypeProduit.VIE ? 'VIE' : 'NONVIE';
        const datePart = this.formatDateReference(new Date());
        const pattern = `${prefix}-${datePart}-`;

        const dernier = await this.devisSimuleRepository
            .createQueryBuilder('devis')
            .select('devis.reference', 'reference')
            .where('devis.reference LIKE :pattern', { pattern: `${pattern}%` })
            .orderBy('devis.reference', 'DESC')
            .limit(1)
            .getRawOne<{ reference?: string }>();

        let compteur = 1;
        if (dernier?.reference) {
            const segments = dernier.reference.split('-');
            const suffix = segments[segments.length - 1];
            const valeurNumerique = parseInt(suffix, 10);
            if (!Number.isNaN(valeurNumerique)) {
                compteur = valeurNumerique + 1;
            }
        }

        return `${pattern}${compteur.toString().padStart(4, '0')}`;
    }

    /**
     * Détermine si l'erreur provient d'un duplicata de référence.
     * @param error Erreur capturée lors de la sauvegarde
     */
    private isDuplicateReferenceError(error: unknown): boolean {
        if (error instanceof QueryFailedError) {
            const anyError = error as unknown as { code?: string; errno?: number };
            return anyError.code === 'ER_DUP_ENTRY' || anyError.errno === 1062;
        }
        if (typeof error === 'object' && error !== null) {
            const anyError = error as { code?: string; errno?: number };
            return anyError.code === 'ER_DUP_ENTRY' || anyError.errno === 1062;
        }
        return false;
    }

    /**
     * Formatte la date du jour pour la référence.
     * @param date Date de référence
     */
    private formatDateReference(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
}

