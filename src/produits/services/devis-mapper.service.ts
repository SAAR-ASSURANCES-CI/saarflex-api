import { Injectable } from '@nestjs/common';
import { DevisSimule } from '../entities/devis-simule.entity';
import { Produit } from '../entities/produit.entity';
import { SimulationDevisSimplifieeResponseDto, InformationsAssureDto } from '../dto/simulation-devis-simplifie.dto';
import { BeneficiaireService } from './beneficiaire.service';

/**
 * Service responsable du mapping des données de devis vers les DTOs
 */
@Injectable()
export class DevisMapperService {
    constructor(
        private readonly beneficiaireService: BeneficiaireService,
    ) {}

    /**
     * Mappe un devis vers le DTO de réponse
     * @param devis Devis simulé
     * @param produit Produit associé
     * @param primeCalculee Prime calculée
     * @param utilisateurId ID utilisateur (optionnel)
     */
    async mapToResponseDto(
        devis: DevisSimule,
        produit: Produit,
        primeCalculee: number,
        utilisateurId?: string
    ): Promise<SimulationDevisSimplifieeResponseDto> {
        
        const informationsAssure = devis.informations_assure as InformationsAssureDto | undefined;
        const beneficiaires = await this.mapBeneficiaires(devis.id);
        
        return {
            id: devis.id,
            reference: devis.reference,
            nom_produit: produit.nom,
            type_produit: produit.type,
            periodicite_prime: produit.periodicite_prime,
            criteres_utilisateur: devis.criteres_utilisateur,
            prime_calculee: primeCalculee,
            assure_est_souscripteur: devis.assure_est_souscripteur,
            informations_assure: informationsAssure,
            front_document_path: devis.chemin_recto_assure || undefined,
            back_document_path: devis.chemin_verso_assure || undefined,
            // beneficiaires: beneficiaires,
            created_at: devis.created_at
        };
    }

    /**
     * Mappe les bénéficiaires pour la réponse
     * @param devisId ID du devis
     */
    private async mapBeneficiaires(
        devisId: string
    ): Promise<Array<{nom_complet: string, lien_souscripteur: string, ordre: number}>> {
        const beneficiaires = await this.beneficiaireService.getBeneficiaires(devisId);
        
        return beneficiaires.map(b => ({
            nom_complet: b.nom_complet,
            lien_souscripteur: b.lien_souscripteur,
            ordre: b.ordre
        }));
    }
}

