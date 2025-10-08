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
        // Essai 1 : Recherche avec critères combinés
        const tarifAvecCombines = await this.trouverTarifAvecCriteresCombines(grilleId, criteres);
        if (tarifAvecCombines) {
            return tarifAvecCombines;
        }

        // Essai 2 : Recherche avec QueryBuilder
        const tarifAvecQuery = await this.trouverTarifAvecQueryBuilder(grilleId, criteres);
        if (tarifAvecQuery) {
            return tarifAvecQuery;
        }

        throw new NotFoundException(
            `Aucun tarif trouvé pour les critères: ${JSON.stringify(criteres)}`
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
        const tarifsAvecCriteresCombines = await this.tarifRepository.find({
            where: { grille_id: grilleId },
            select: ['id', 'montant_fixe', 'criteres_combines']
        });

        for (const tarif of tarifsAvecCriteresCombines) {
            if (tarif.criteres_combines) {
                const correspondance = this.verifierCorrespondanceCriteres(
                    tarif.criteres_combines, 
                    criteres
                );
                
                if (correspondance) {
                    const tarifTrouve = await this.tarifRepository.findOne({
                        where: { id: tarif.id }
                    });
                    
                    if (tarifTrouve) {
                        return tarifTrouve;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Vérifie la correspondance entre critères attendus et fournis
     * @param criteresAttendus Critères du tarif
     * @param criteresFournis Critères de l'utilisateur
     */
    private verifierCorrespondanceCriteres(
        criteresAttendus: Record<string, any>,
        criteresFournis: Record<string, any>
    ): boolean {
        for (const [nomCritere, valeurAttendue] of Object.entries(criteresAttendus)) {
            const critereKey = Object.keys(criteresFournis).find(key => 
                key.toLowerCase() === nomCritere.toLowerCase()
            );
            const valeurFournie = critereKey ? criteresFournis[critereKey] : undefined;
            
            if (!valeurFournie || valeurFournie.toString() !== valeurAttendue.toString()) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Recherche un tarif avec QueryBuilder
     * @param grilleId ID de la grille
     * @param criteres Critères fournis
     */
    private async trouverTarifAvecQueryBuilder(
        grilleId: string,
        criteres: Record<string, any>
    ): Promise<Tarif | null> {
        const queryBuilder = this.tarifRepository
            .createQueryBuilder('tarif')
            .leftJoinAndSelect('tarif.critere', 'critere')
            .leftJoinAndSelect('tarif.valeurCritere', 'valeurCritere')
            .where('tarif.grille_id = :grilleId', { grilleId });

        let paramIndex = 0;
        for (const [nomCritere, valeur] of Object.entries(criteres)) {
            const paramKey = `param${paramIndex}`;
            queryBuilder
                .andWhere(`critere.nom = :nomCritere${paramKey}`, { [`nomCritere${paramKey}`]: nomCritere })
                .andWhere(`valeurCritere.valeur = :valeur${paramKey}`, { [`valeur${paramKey}`]: valeur.toString() });
            paramIndex++;
        }

        return await queryBuilder.getOne();
    }
}

