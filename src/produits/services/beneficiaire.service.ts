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
    ) { }

    /**
     * Ajoute des bénéficiaires à un contrat
     * @param contratId ID du contrat
     * @param beneficiaires Liste des bénéficiaires à ajouter
     */
    async ajouterBeneficiaires(
        contratId: string,
        beneficiaires: Array<{ nom_complet: string, lien_souscripteur: string, ordre: number }>
    ): Promise<void> {
        for (const beneficiaireData of beneficiaires) {
            const beneficiaire = this.beneficiaireRepository.create({
                contrat_id: contratId,
                nom_complet: beneficiaireData.nom_complet,
                lien_souscripteur: beneficiaireData.lien_souscripteur,
                ordre: beneficiaireData.ordre
            });

            await this.beneficiaireRepository.save(beneficiaire);
        }
    }

    /**
     * Récupère les bénéficiaires d'un contrat
     * @param contratId ID du contrat
     * @param ordre Ordre de tri (ASC par défaut)
     */
    async getBeneficiaires(
        contratId: string,
        ordre: 'ASC' | 'DESC' = 'ASC'
    ): Promise<Beneficiaire[]> {
        return await this.beneficiaireRepository.find({
            where: { contrat_id: contratId },
            order: { ordre }
        });
    }

    /**
     * Supprime tous les bénéficiaires d'un contrat
     * @param contratId ID du contrat
     */
    async supprimerBeneficiaires(contratId: string): Promise<void> {
        await this.beneficiaireRepository.delete({ contrat_id: contratId });
    }

    /**
     * Met à jour les bénéficiaires d'un contrat
     * @param contratId ID du contrat
     * @param beneficiaires Nouvelle liste de bénéficiaires
     */
    async updateBeneficiaires(
        contratId: string,
        beneficiaires: Array<{ nom_complet: string, lien_souscripteur: string, ordre: number }>
    ): Promise<void> {
        // Supprimer les anciens
        await this.supprimerBeneficiaires(contratId);

        // Ajouter les nouveaux
        await this.ajouterBeneficiaires(contratId, beneficiaires);
    }

    /**
     * Compte le nombre de bénéficiaires d'un contrat
     * @param contratId ID du contrat
     */
    async compterBeneficiaires(contratId: string): Promise<number> {
        return await this.beneficiaireRepository.count({
            where: { contrat_id: contratId }
        });
    }
}

