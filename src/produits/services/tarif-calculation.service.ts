import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrilleTarifaire, StatutGrille } from '../entities/grille-tarifaire.entity';
import { Tarif } from '../entities/tarif.entity';

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
    ) {}

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
    private normaliserNomCritere(nom: string): string {
        if (!nom) return '';
        
        // Supprimer les accents
        let normalise = nom
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        
        // Convertir en minuscules
        normalise = normalise.toLowerCase();
        
        // Supprimer les espaces multiples et trim
        normalise = normalise.replace(/\s+/g, ' ').trim();
        
        // Supprimer les articles courants en début de phrase
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
    private verifierCorrespondanceCriteres(
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
        
        // Vérifier chaque critère attendu
        for (const [nomCritere, valeurAttendue] of Object.entries(criteresAttendus)) {
            const nomCritereNormalise = this.normaliserNomCritere(nomCritere);
            
            console.log(`[TarifCalculation] Recherche critère attendu: "${nomCritere}" (normalisé: "${nomCritereNormalise}") = ${valeurAttendue}`);
            
            const critereFourni = criteresFournisNormalises.get(nomCritereNormalise);
            
            if (!critereFourni) {
                // Critère attendu non trouvé dans les critères fournis
                console.log(`[TarifCalculation] ❌ Critère "${nomCritere}" (normalisé: "${nomCritereNormalise}") non trouvé dans les critères fournis`);
                return false;
            }
            
            // Comparer les valeurs 
            const valeurAttendueStr = valeurAttendue?.toString().trim() || '';
            const valeurFournieStr = critereFourni.valeur?.toString().trim() || '';
            
            console.log(`[TarifCalculation] Comparaison valeur: attendue="${valeurAttendueStr}" vs fournie="${valeurFournieStr}"`);
            
            if (valeurAttendueStr !== valeurFournieStr) {
                
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
}

