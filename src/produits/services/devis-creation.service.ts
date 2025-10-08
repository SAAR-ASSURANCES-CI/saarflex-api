import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';
import { Produit } from '../entities/produit.entity';
import { GrilleTarifaire } from '../entities/grille-tarifaire.entity';
import { Profile } from '../../users/entities/profile.entity';
import { CreateSimulationDevisSimplifieeDto } from '../dto/simulation-devis-simplifie.dto';

const DUREE_VALIDITE_SIMULATION = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Service responsable de la création de devis simulés
 */
@Injectable()
export class DevisCreationService {
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

        const devis = this.devisSimuleRepository.create(devisData);
        return await this.devisSimuleRepository.save(devis);
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
}

