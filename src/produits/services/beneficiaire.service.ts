import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiaire } from '../entities/beneficiaire.entity';

/**
 * Service responsable de la gestion des bénéficiaires de devis
 */
@Injectable()
export class BeneficiaireService {
    constructor(
        @InjectRepository(Beneficiaire)
        private readonly beneficiaireRepository: Repository<Beneficiaire>,
    ) {}

    /**
     * Ajoute des bénéficiaires à un devis
     * @param devisId ID du devis
     * @param beneficiaires Liste des bénéficiaires à ajouter
     */
    async ajouterBeneficiaires(
        devisId: string,
        beneficiaires: Array<{nom_complet: string, lien_souscripteur: string, ordre: number}>
    ): Promise<void> {
        for (const beneficiaireData of beneficiaires) {
            const beneficiaire = this.beneficiaireRepository.create({
                devis_simule_id: devisId,
                nom_complet: beneficiaireData.nom_complet,
                lien_souscripteur: beneficiaireData.lien_souscripteur,
                ordre: beneficiaireData.ordre
            });

            await this.beneficiaireRepository.save(beneficiaire);
        }
    }

    /**
     * Récupère les bénéficiaires d'un devis
     * @param devisId ID du devis
     * @param ordre Ordre de tri (ASC par défaut)
     */
    async getBeneficiaires(
        devisId: string,
        ordre: 'ASC' | 'DESC' = 'ASC'
    ): Promise<Beneficiaire[]> {
        return await this.beneficiaireRepository.find({
            where: { devis_simule_id: devisId },
            order: { ordre }
        });
    }

    /**
     * Supprime tous les bénéficiaires d'un devis
     * @param devisId ID du devis
     */
    async supprimerBeneficiaires(devisId: string): Promise<void> {
        await this.beneficiaireRepository.delete({ devis_simule_id: devisId });
    }

    /**
     * Met à jour les bénéficiaires d'un devis
     * @param devisId ID du devis
     * @param beneficiaires Nouvelle liste de bénéficiaires
     */
    async updateBeneficiaires(
        devisId: string,
        beneficiaires: Array<{nom_complet: string, lien_souscripteur: string, ordre: number}>
    ): Promise<void> {
        // Supprimer les anciens
        await this.supprimerBeneficiaires(devisId);
        
        // Ajouter les nouveaux
        await this.ajouterBeneficiaires(devisId, beneficiaires);
    }

    /**
     * Compte le nombre de bénéficiaires d'un devis
     * @param devisId ID du devis
     */
    async compterBeneficiaires(devisId: string): Promise<number> {
        return await this.beneficiaireRepository.count({
            where: { devis_simule_id: devisId }
        });
    }
}

