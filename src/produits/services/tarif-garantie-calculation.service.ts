import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarifGarantie, TypeCalculTarif, StatutTarifGarantie } from '../entities/tarif-garantie.entity';
import { Garantie } from '../entities/garantie.entity';
import { evaluate } from 'mathjs';

export interface CalculTarifGarantieParams {
    garantie_id: string;
    valeur_neuve?: number;
    valeur_venale?: number;
    date_reference?: Date;
    criteres_additionnels?: Record<string, any>;
}

export interface ResultatCalculTarif {
    garantie_id: string;
    garantie_nom: string;
    type_calcul: TypeCalculTarif;
    montant_calcule: number;
    details_calcul: {
        tarif_id: string;
        montant_base?: number;
        taux_pourcentage?: number;
        valeur_reference?: number;
        formule?: string;
    };
}

/**
 * Service de calcul des tarifs de garanties
 * Gère les différents types de calcul : fixe, pourcentage VN, pourcentage VV, formule personnalisée
 */
@Injectable()
export class TarifGarantieCalculationService {
    constructor(
        @InjectRepository(TarifGarantie)
        private readonly tarifGarantieRepository: Repository<TarifGarantie>,
        @InjectRepository(Garantie)
        private readonly garantieRepository: Repository<Garantie>,
    ) { }

    /**
     * Calcule le tarif d'une garantie en fonction de ses paramètres
     * @param params Paramètres de calcul
     */
    async calculerTarifGarantie(params: CalculTarifGarantieParams): Promise<ResultatCalculTarif> {
        const { garantie_id, valeur_neuve, valeur_venale, date_reference = new Date() } = params;

        // Récupérer la garantie
        const garantie = await this.garantieRepository.findOne({
            where: { id: garantie_id }
        });

        if (!garantie) {
            throw new BadRequestException(`Garantie ${garantie_id} introuvable`);
        }

        // Trouver le tarif actif pour cette garantie à la date de référence
        const tarif = await this.trouverTarifActif(garantie_id, date_reference);

        if (!tarif) {
            throw new BadRequestException(
                `Aucun tarif actif trouvé pour la garantie "${garantie.nom}" à la date ${date_reference.toISOString().split('T')[0]}`
            );
        }

        // Calculer le montant selon le type de calcul
        const montant_calcule = await this.calculerMontant(tarif, valeur_neuve, valeur_venale);

        return {
            garantie_id: garantie.id,
            garantie_nom: garantie.nom,
            type_calcul: tarif.type_calcul,
            montant_calcule,
            details_calcul: {
                tarif_id: tarif.id,
                montant_base: tarif.montant_base,
                taux_pourcentage: tarif.taux_pourcentage,
                valeur_reference: this.getValeurReference(tarif.type_calcul, valeur_neuve, valeur_venale),
                formule: tarif.formule_calcul
            }
        };
    }

    /**
     * Calcule les tarifs pour plusieurs garanties
     * @param garantie_ids Liste des IDs de garanties
     * @param params Paramètres communs de calcul
     */
    async calculerTarifsGaranties(
        garantie_ids: string[],
        params: Omit<CalculTarifGarantieParams, 'garantie_id'>
    ): Promise<ResultatCalculTarif[]> {
        const resultats: ResultatCalculTarif[] = [];

        for (const garantie_id of garantie_ids) {
            try {
                const resultat = await this.calculerTarifGarantie({
                    ...params,
                    garantie_id
                });
                resultats.push(resultat);
            } catch (error) {
                console.error(`Erreur calcul tarif garantie ${garantie_id}:`, error.message);
                // On continue avec les autres garanties
            }
        }

        return resultats;
    }

    /**
     * Trouve le tarif actif pour une garantie à une date donnée
     * @param garantie_id ID de la garantie
     * @param date_reference Date de référence
     */
    private async trouverTarifActif(garantie_id: string, date_reference: Date): Promise<TarifGarantie | null> {
        const tarif = await this.tarifGarantieRepository
            .createQueryBuilder('tarif')
            .where('tarif.garantie_id = :garantie_id', { garantie_id })
            .andWhere('tarif.statut = :statut', { statut: StatutTarifGarantie.ACTIF })
            .andWhere('tarif.date_debut <= :date_ref', { date_ref: date_reference })
            .andWhere('(tarif.date_fin IS NULL OR tarif.date_fin >= :date_ref)', { date_ref: date_reference })
            .orderBy('tarif.date_debut', 'DESC')
            .getOne();

        return tarif;
    }

    /**
     * Calcule le montant selon le type de calcul
     * @param tarif Tarif de la garantie
     * @param valeur_neuve Valeur à neuf du véhicule
     * @param valeur_venale Valeur vénale du véhicule
     */
    private async calculerMontant(
        tarif: TarifGarantie,
        valeur_neuve?: number,
        valeur_venale?: number
    ): Promise<number> {
        switch (tarif.type_calcul) {
            case TypeCalculTarif.MONTANT_FIXE:
                return this.calculerMontantFixe(tarif);

            case TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE:
                return this.calculerPourcentageValeurNeuve(tarif, valeur_neuve);

            case TypeCalculTarif.POURCENTAGE_VALEUR_VENALE:
                return this.calculerPourcentageValeurVenale(tarif, valeur_venale);

            case TypeCalculTarif.FORMULE_PERSONNALISEE:
                return this.calculerAvecFormule(tarif, valeur_neuve, valeur_venale);

            default:
                throw new BadRequestException(`Type de calcul non supporté: ${tarif.type_calcul}`);
        }
    }

    /**
     * Calcul avec montant fixe
     */
    private calculerMontantFixe(tarif: TarifGarantie): number {
        if (!tarif.montant_base) {
            throw new BadRequestException('Montant de base manquant pour le calcul fixe');
        }
        return Number(tarif.montant_base);
    }

    /**
     * Calcul avec pourcentage de la valeur à neuf
     */
    private calculerPourcentageValeurNeuve(tarif: TarifGarantie, valeur_neuve?: number): number {
        if (!tarif.taux_pourcentage) {
            throw new BadRequestException('Taux de pourcentage manquant pour le calcul sur valeur neuve');
        }
        if (!valeur_neuve || valeur_neuve <= 0) {
            throw new BadRequestException('Valeur à neuf requise et doit être supérieure à 0');
        }

        const montant = (valeur_neuve * Number(tarif.taux_pourcentage)) / 100;
        return Math.round(montant * 100) / 100; // Arrondi à 2 décimales
    }

    /**
     * Calcul avec pourcentage de la valeur vénale
     */
    private calculerPourcentageValeurVenale(tarif: TarifGarantie, valeur_venale?: number): number {
        if (!tarif.taux_pourcentage) {
            throw new BadRequestException('Taux de pourcentage manquant pour le calcul sur valeur vénale');
        }
        if (!valeur_venale || valeur_venale <= 0) {
            throw new BadRequestException('Valeur vénale requise et doit être supérieure à 0');
        }

        const montant = (valeur_venale * Number(tarif.taux_pourcentage)) / 100;
        return Math.round(montant * 100) / 100; // Arrondi à 2 décimales
    }

    /**
     * Calcul avec formule personnalisée
     * La formule peut utiliser : valeur_neuve, valeur_venale, montant_base
     */
    private calculerAvecFormule(
        tarif: TarifGarantie,
        valeur_neuve?: number,
        valeur_venale?: number
    ): number {
        if (!tarif.formule_calcul) {
            throw new BadRequestException('Formule de calcul manquante');
        }

        try {
            // Variables disponibles dans la formule
            const context = {
                valeur_neuve: valeur_neuve || 0,
                valeur_venale: valeur_venale || 0,
                montant_base: Number(tarif.montant_base) || 0,
                taux_pourcentage: Number(tarif.taux_pourcentage) || 0
            };

            // Évaluation sécurisée de la formule
            const resultat = this.evaluerFormule(tarif.formule_calcul, context);

            return Math.round(resultat * 100) / 100; // Arrondi à 2 décimales
        } catch (error) {
            throw new BadRequestException(`Erreur lors de l'évaluation de la formule: ${error.message}`);
        }
    }

    /**
     * Évalue une formule mathématique de manière sécurisée avec mathjs
     * @param formule Formule mathématique à évaluer
     * @param context Variables disponibles dans la formule
     */
    private evaluerFormule(formule: string, context: Record<string, number>): number {
        try {
            
            const resultat = evaluate(formule, context);

            // Vérifier que le résultat est un nombre
            if (typeof resultat !== 'number' || isNaN(resultat)) {
                throw new Error('La formule ne retourne pas un nombre valide');
            }

            return resultat;
        } catch (error) {
            throw new BadRequestException(
                `Erreur lors de l'évaluation de la formule "${formule}": ${error.message}`
            );
        }
    }

    /**
     * Retourne la valeur de référence utilisée pour le calcul
     */
    private getValeurReference(
        type_calcul: TypeCalculTarif,
        valeur_neuve?: number,
        valeur_venale?: number
    ): number | undefined {
        switch (type_calcul) {
            case TypeCalculTarif.POURCENTAGE_VALEUR_NEUVE:
                return valeur_neuve;
            case TypeCalculTarif.POURCENTAGE_VALEUR_VENALE:
                return valeur_venale;
            default:
                return undefined;
        }
    }
}
