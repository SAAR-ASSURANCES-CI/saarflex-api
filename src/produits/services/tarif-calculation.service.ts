import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrilleTarifaire, StatutGrille } from '../entities/grille-tarifaire.entity';
import { Tarif, TypeCalculTarif } from '../entities/tarif.entity';
import { evaluate } from 'mathjs';

/**
 * Service responsable du calcul et de la recherche de tarifs
 */
@Injectable()
export class TarifCalculationService {
    constructor(
        @InjectRepository(GrilleTarifaire)
        private readonly grilleTarifaireRepository: Repository<GrilleTarifaire>,
        @InjectRepository(Tarif)
        private readonly tarifRepository: Repository<Tarif>,
    ) { }

    /**
     * Trouve la grille tarifaire active pour un produit
     * @param produitId ID du produit
     */
    async trouverGrilleTarifaireActive(produitId: string): Promise<GrilleTarifaire> {
        const grille = await this.grilleTarifaireRepository.findOne({
            where: {
                produit_id: produitId,
                statut: StatutGrille.ACTIF
            },
            relations: ['tarifs']
        });

        if (!grille) {
            throw new NotFoundException('Aucune grille tarifaire active trouvée pour ce produit');
        }

        return grille;
    }

    /**
     * Trouve le tarif fixe correspondant aux critères
     * @param grilleId ID de la grille tarifaire
     * @param criteres Critères de tarification
     */
    async trouverTarifFixe(
        grilleId: string,
        criteres: Record<string, any>
    ): Promise<Tarif> {
        // Log des critères reçus pour debug
        console.log(`[TarifCalculation] Recherche tarif pour grille ${grilleId}`);
        console.log(`[TarifCalculation] Critères reçus:`, JSON.stringify(criteres, null, 2));

        // Essai 1 : Recherche avec critères combinés
        const tarifAvecCombines = await this.trouverTarifAvecCriteresCombines(grilleId, criteres);
        if (tarifAvecCombines) {
            console.log(`[TarifCalculation] Tarif trouvé via critères combinés: ${tarifAvecCombines.id}`);
            return tarifAvecCombines;
        }

        // Essai 2 : Recherche avec QueryBuilder
        const tarifAvecQuery = await this.trouverTarifAvecQueryBuilder(grilleId, criteres);
        if (tarifAvecQuery) {
            console.log(`[TarifCalculation] Tarif trouvé via QueryBuilder: ${tarifAvecQuery.id}`);
            return tarifAvecQuery;
        }

        // Récupérer les critères attendus pour améliorer le message d'erreur
        const grille = await this.grilleTarifaireRepository.findOne({
            where: { id: grilleId },
            relations: ['tarifs']
        });

        const criteresAttendus = grille?.tarifs
            .filter(t => t.criteres_combines)
            .map(t => Object.keys(t.criteres_combines || {}))
            .flat()
            .filter((v, i, a) => a.indexOf(v) === i) // Unique
            .join(', ') || 'aucun critère configuré';

        throw new NotFoundException(
            `Aucun tarif trouvé pour les critères: ${JSON.stringify(criteres)}. ` +
            `Critères attendus (exemples): ${criteresAttendus}`
        );
    }

    /**
     * Recherche un tarif avec des critères combinés (JSON)
     * @param grilleId ID de la grille
     * @param criteres Critères fournis
     */
    private async trouverTarifAvecCriteresCombines(
        grilleId: string,
        criteres: Record<string, any>
    ): Promise<Tarif | null> {
        console.log(`[TarifCalculation] Recherche via critères combinés pour grille ${grilleId}`);

        const tarifsAvecCriteresCombines = await this.tarifRepository.find({
            where: { grille_id: grilleId },
            select: ['id', 'montant_fixe', 'criteres_combines']
        });

        console.log(`[TarifCalculation] ${tarifsAvecCriteresCombines.length} tarif(s) avec critères combinés trouvé(s)`);

        for (const tarif of tarifsAvecCriteresCombines) {
            if (tarif.criteres_combines) {
                console.log(`[TarifCalculation] Vérification tarif ${tarif.id} avec critères:`, JSON.stringify(tarif.criteres_combines, null, 2));

                const correspondance = this.verifierCorrespondanceCriteres(
                    tarif.criteres_combines,
                    criteres
                );

                console.log(`[TarifCalculation] Tarif ${tarif.id} - Correspondance: ${correspondance ? 'OUI' : 'NON'}`);

                if (correspondance) {
                    const tarifTrouve = await this.tarifRepository.findOne({
                        where: { id: tarif.id }
                    });

                    if (tarifTrouve) {
                        console.log(`[TarifCalculation] Tarif trouvé via critères combinés: ${tarifTrouve.id}, Montant: ${tarifTrouve.montant_fixe}`);
                        return tarifTrouve;
                    }
                }
            }
        }

        console.log(`[TarifCalculation] Aucun tarif trouvé via critères combinés`);
        return null;
    }

    /**
     * Normalise un nom de critère pour faciliter la correspondance
     * - Supprime les accents
     * - Normalise la casse
     * - Supprime les espaces multiples
     * - Supprime les articles courants
     * @param nom Nom du critère à normaliser
     */
    public normaliserNomCritere(nom: string): string {
        if (!nom) return '';

        let normalise = nom
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        normalise = normalise.toLowerCase();

        normalise = normalise.replace(/\s+/g, ' ').trim();

        const articles = ['de', 'du', 'des', 'le', 'la', 'les', 'un', 'une'];
        const mots = normalise.split(' ');
        if (mots.length > 1 && articles.includes(mots[0])) {
            normalise = mots.slice(1).join(' ');
        }

        return normalise;
    }

    /**
     * Vérifie la correspondance entre critères attendus et fournis
     * Utilise une normalisation pour gérer les variations de noms
     * @param criteresAttendus Critères du tarif
     * @param criteresFournis Critères de l'utilisateur
     */
    public verifierCorrespondanceCriteres(
        criteresAttendus: Record<string, any>,
        criteresFournis: Record<string, any>
    ): boolean {

        const criteresFournisNormalises = new Map<string, { originalKey: string; valeur: any }>();

        for (const [key, valeur] of Object.entries(criteresFournis)) {
            const keyNormalise = this.normaliserNomCritere(key);

            if (!criteresFournisNormalises.has(keyNormalise)) {
                criteresFournisNormalises.set(keyNormalise, { originalKey: key, valeur });
            }
        }

        console.log(`[TarifCalculation] Critères fournis normalisés:`, Array.from(criteresFournisNormalises.entries()).map(([k, v]) => `${k} (original: ${v.originalKey}) = ${v.valeur}`).join(', '));

        for (const [nomCritere, valeurAttendue] of Object.entries(criteresAttendus)) {
            const nomCritereNormalise = this.normaliserNomCritere(nomCritere);

            console.log(`[TarifCalculation] Recherche critère attendu: "${nomCritere}" (normalisé: "${nomCritereNormalise}") = ${valeurAttendue}`);

            const critereFourni = criteresFournisNormalises.get(nomCritereNormalise);

            if (!critereFourni) {
                console.log(`[TarifCalculation] ❌ Critère "${nomCritere}" (normalisé: "${nomCritereNormalise}") non trouvé dans les critères fournis`);
                return false;
            }


            const valeurAttendueStr = valeurAttendue?.toString().trim() || '';
            const valeurFournieStr = critereFourni.valeur?.toString().trim() || '';

            console.log(`[TarifCalculation] Comparaison valeur: attendue="${valeurAttendueStr}" vs fournie="${valeurFournieStr}"`);

            if (valeurAttendueStr !== valeurFournieStr) {
                if (valeurAttendueStr.includes('-')) {
                    const [min, max] = valeurAttendueStr.split('-').map(v => Number(v.trim()));
                    const valeurFournieNum = Number(valeurFournieStr);

                    if (!isNaN(min) && !isNaN(max) && !isNaN(valeurFournieNum)) {
                        if (valeurFournieNum >= min && valeurFournieNum <= max) {
                            console.log(`[TarifCalculation] ✅ Valeur ${valeurFournieNum} comprise dans l'intervalle [${min}, ${max}]`);
                            continue;
                        }
                    }
                }

                console.log(`[TarifCalculation] ❌ Valeurs ne correspondent pas pour "${nomCritere}"`);
                return false;
            }

            console.log(`[TarifCalculation] ✅ Critère "${nomCritere}" correspond`);
        }

        console.log(`[TarifCalculation] ✅ Tous les critères correspondent`);
        return true;
    }

    /**
     * Recherche un tarif avec QueryBuilder
     * Utilise une recherche plus flexible avec normalisation des noms
     * @param grilleId ID de la grille
     * @param criteres Critères fournis
     */
    private async trouverTarifAvecQueryBuilder(
        grilleId: string,
        criteres: Record<string, any>
    ): Promise<Tarif | null> {
        console.log(`[TarifCalculation] Recherche via QueryBuilder pour grille ${grilleId}`);

        // Récupérer tous les tarifs de la grille avec leurs critères
        const tarifs = await this.tarifRepository
            .createQueryBuilder('tarif')
            .leftJoinAndSelect('tarif.critere', 'critere')
            .leftJoinAndSelect('tarif.valeurCritere', 'valeurCritere')
            .where('tarif.grille_id = :grilleId', { grilleId })
            .getMany();

        console.log(`[TarifCalculation] ${tarifs.length} tarif(s) récupéré(s) avec QueryBuilder`);

        // Créer un map normalisé des critères fournis
        const criteresFournisNormalises = new Map<string, string>();
        for (const [nomCritere, valeur] of Object.entries(criteres)) {
            const nomNormalise = this.normaliserNomCritere(nomCritere);
            criteresFournisNormalises.set(nomNormalise, valeur.toString());
            console.log(`[TarifCalculation] Critère fourni: "${nomCritere}" (normalisé: "${nomNormalise}") = ${valeur}`);
        }

        // Chercher un tarif qui correspond à tous les critères
        for (const tarif of tarifs) {
            if (!tarif.critere) continue;

            const nomCritereNormalise = this.normaliserNomCritere(tarif.critere.nom);
            const valeurAttendue = criteresFournisNormalises.get(nomCritereNormalise);

            console.log(`[TarifCalculation] Vérification tarif ${tarif.id} - Critère: "${tarif.critere.nom}" (normalisé: "${nomCritereNormalise}")`);

            if (valeurAttendue && tarif.valeurCritere) {
                // Vérifier si la valeur correspond
                const valeurCritereStr = tarif.valeurCritere.valeur?.toString().trim() || '';
                console.log(`[TarifCalculation] Comparaison valeur: attendue="${valeurAttendue}" vs tarif="${valeurCritereStr}"`);

                if (valeurAttendue.trim() === valeurCritereStr) {
                    console.log(`[TarifCalculation] Valeur correspond, vérification de la correspondance complète...`);

                    // Vérifier si tous les critères fournis correspondent
                    const correspondanceComplete = this.verifierCorrespondanceComplete(
                        tarifs.filter(t => t.grille_id === tarif.grille_id && t.critere),
                        criteresFournisNormalises
                    );

                    if (correspondanceComplete) {
                        console.log(`[TarifCalculation] ✅ Tarif trouvé via QueryBuilder: ${tarif.id}, Montant: ${tarif.montant_fixe}`);
                        return tarif;
                    } else {
                        console.log(`[TarifCalculation] ❌ Correspondance incomplète pour tarif ${tarif.id}`);
                    }
                } else {
                    console.log(`[TarifCalculation] ❌ Valeur ne correspond pas pour tarif ${tarif.id}`);
                }
            } else {
                console.log(`[TarifCalculation] ❌ Critère "${tarif.critere.nom}" non trouvé dans les critères fournis`);
            }
        }

        console.log(`[TarifCalculation] Aucun tarif trouvé via QueryBuilder`);
        return null;
    }

    /**
     * Vérifie si tous les critères fournis correspondent aux tarifs
     * @param tarifs Liste des tarifs à vérifier
     * @param criteresFournisNormalises Map des critères fournis (nom normalisé → valeur)
     */
    private verifierCorrespondanceComplete(
        tarifs: Tarif[],
        criteresFournisNormalises: Map<string, string>
    ): boolean {
        // Pour chaque critère fourni, on doit trouver un tarif correspondant
        for (const [nomNormalise, valeur] of criteresFournisNormalises.entries()) {
            const tarifCorrespondant = tarifs.find(t => {
                if (!t.critere || !t.valeurCritere) return false;
                const nomCritereNormalise = this.normaliserNomCritere(t.critere.nom);
                const valeurCritereStr = t.valeurCritere.valeur?.toString().trim() || '';
                return nomCritereNormalise === nomNormalise && valeurCritereStr === valeur.trim();
            });

            if (!tarifCorrespondant) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calcule la prime à partir d'un tarif selon son type de calcul
     * @param tarif Tarif trouvé
     * @param criteres Critères utilisateur (contient valeur_neuve, valeur_venale, etc.)
     */
    calculerPrime(
        tarif: Tarif,
        criteres: Record<string, any>
    ): number {
        const typeCalcul = tarif.type_calcul || TypeCalculTarif.MONTANT_FIXE;

        console.log(`[TarifCalculation] Calcul de la prime - Type: ${typeCalcul}`);
        console.log(`[TarifCalculation] Tarif: montant_fixe=${tarif.montant_fixe}, taux=${tarif.taux_pourcentage}, formule=${tarif.formule_calcul}`);

        switch (typeCalcul) {
            case TypeCalculTarif.MONTANT_FIXE:
                return this.calculerMontantFixe(tarif);

            case TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE:
                return this.calculerPourcentageValeurNeuve(tarif, criteres);

            case TypeCalculTarif.POURCENTAGE_VALEUR_VENALE:
                return this.calculerPourcentageValeurVenale(tarif, criteres);

            case TypeCalculTarif.FORMULE_PERSONNALISEE:
                return this.calculerFormulePersonnalisee(tarif, criteres);

            default:
                console.warn(`[TarifCalculation] Type de calcul inconnu: ${typeCalcul}, utilisation du montant fixe`);
                return this.calculerMontantFixe(tarif);
        }
    }

    private calculerMontantFixe(tarif: Tarif): number {
        const montant = Number(tarif.montant_fixe) || 0;
        console.log(`[TarifCalculation] Montant fixe: ${montant}`);
        return montant;
    }

    private calculerPourcentageValeurNeuve(tarif: Tarif, criteres: Record<string, any>): number {
        const valeurNeuve = this.extraireValeurNumerique(criteres, 'Valeur à Neuf', 'valeur_neuve', 'ValeurNeuve');
        const taux = Number(tarif.taux_pourcentage) || 0;

        if (!valeurNeuve || valeurNeuve <= 0) {
            throw new BadRequestException(
                'La valeur à neuf est requise pour ce type de tarif (% Valeur Neuve). ' +
                'Critères disponibles: ' + Object.keys(criteres).join(', ')
            );
        }

        const prime = (valeurNeuve * taux) / 100;
        console.log(`[TarifCalculation] Calcul % VN: ${valeurNeuve} * ${taux}% = ${prime}`);
        return Math.round(prime * 100) / 100;
    }

    private calculerPourcentageValeurVenale(tarif: Tarif, criteres: Record<string, any>): number {
        const valeurVenale = this.extraireValeurNumerique(criteres, 'Valeur Vénale', 'valeur_venale', 'ValeurVenale');
        const taux = Number(tarif.taux_pourcentage) || 0;

        if (!valeurVenale || valeurVenale <= 0) {
            throw new BadRequestException(
                'La valeur vénale est requise pour ce type de tarif (% Valeur Vénale). ' +
                'Critères disponibles: ' + Object.keys(criteres).join(', ')
            );
        }

        const prime = (valeurVenale * taux) / 100;
        console.log(`[TarifCalculation] Calcul % VV: ${valeurVenale} * ${taux}% = ${prime}`);
        return Math.round(prime * 100) / 100;
    }

    private calculerFormulePersonnalisee(tarif: Tarif, criteres: Record<string, any>): number {
        if (!tarif.formule_calcul) {
            throw new BadRequestException('Formule de calcul personnalisée non définie pour ce tarif');
        }

        try {
            const context = {
                valeur_neuve: this.extraireValeurNumerique(criteres, 'Valeur à Neuf', 'valeur_neuve', 'ValeurNeuve') || 0,
                valeur_venale: this.extraireValeurNumerique(criteres, 'Valeur Vénale', 'valeur_venale', 'ValeurVenale') || 0,
                montant_base: Number(tarif.montant_fixe) || 0,
                taux_pourcentage: Number(tarif.taux_pourcentage) || 0
            };

            console.log(`[TarifCalculation] Évaluation formule: "${tarif.formule_calcul}" avec contexte:`, context);

            const resultat = evaluate(tarif.formule_calcul, context);
            const prime = typeof resultat === 'number' ? resultat : Number(resultat);

            console.log(`[TarifCalculation] Résultat formule: ${prime}`);
            return Math.round(prime * 100) / 100;
        } catch (error) {
            throw new BadRequestException(
                `Erreur lors de l'évaluation de la formule "${tarif.formule_calcul}": ${error.message}`
            );
        }
    }

    /**
     * Extrait une valeur numérique des critères en essayant plusieurs clés possibles
     */
    private extraireValeurNumerique(criteres: Record<string, any>, ...cles: string[]): number | null {
        for (const cle of cles) {
            // Recherche exacte
            if (criteres[cle] !== undefined) {
                const valeur = Number(criteres[cle]);
                if (!isNaN(valeur)) {
                    console.log(`[TarifCalculation] Valeur trouvée pour "${cle}": ${valeur}`);
                    return valeur;
                }
            }

            // Recherche insensible à la casse et aux accents
            const cleNormalisee = this.normaliserNomCritere(cle);
            for (const [critereKey, critereValue] of Object.entries(criteres)) {
                if (this.normaliserNomCritere(critereKey) === cleNormalisee) {
                    const valeur = Number(critereValue);
                    if (!isNaN(valeur)) {
                        console.log(`[TarifCalculation] Valeur trouvée pour "${critereKey}" (normalisé: "${cleNormalisee}"): ${valeur}`);
                        return valeur;
                    }
                }
            }
        }

        return null;
    }
}

