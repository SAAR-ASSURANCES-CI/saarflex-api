import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../users/entities/profile.entity';
import { Produit, TypeProduit } from '../entities/produit.entity';
import { CreateSimulationDevisSimplifieeDto } from '../dto/simulation-devis-simplifie.dto';

/**
 * Service responsable de la validation des données de souscription
 */
@Injectable()
export class DevisValidationService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
    ) {}

    /**
     * Valide les données de souscription selon le type (pour soi-même ou autre personne)
     * @param simulationDto Données de simulation
     * @param utilisateurId ID utilisateur
     * @param produit Produit concerné
     */
    async validerSouscription(
        simulationDto: CreateSimulationDevisSimplifieeDto,
        utilisateurId: string,
        produit: Produit
    ): Promise<void> {
        
        if (simulationDto.assure_est_souscripteur) {
            await this.validerProfilComplet(utilisateurId, produit.type);
        } else {
            await this.validerInformationsAssure(simulationDto.informations_assure, produit.type);
        }
    }

    /**
     * Valide que le profil de l'utilisateur est complet
     * @param utilisateurId ID utilisateur
     * @param typeProduit Type de produit
     */
    private async validerProfilComplet(
        utilisateurId: string,
        typeProduit: TypeProduit
    ): Promise<void> {
        if (!utilisateurId) {
            throw new BadRequestException('Utilisateur non authentifié');
        }

        const profile = await this.profileRepository.findOne({
            where: { user_id: utilisateurId }
        });

        if (!profile) {
            throw new BadRequestException('Profil utilisateur non trouvé. Veuillez compléter votre profil.');
        }

        if (typeProduit === TypeProduit.VIE) {
            if (!profile.date_naissance) {
                throw new BadRequestException('Date de naissance requise pour les produits Vie. Veuillez compléter votre profil.');
            }
        }

        const champsRequis = [
            'numero_piece_identite',
            'type_piece_identite',
            'adresse'
        ];

        for (const champ of champsRequis) {
            if (!profile[champ]) {
                throw new BadRequestException(`${champ} requis. Veuillez compléter votre profil.`);
            }
        }
    }

    /**
     * Valide les informations de l'assuré (quand ce n'est pas pour soi-même)
     * @param informationsAssure Informations de l'assuré
     * @param typeProduit Type de produit
     */
    private async validerInformationsAssure(
        informationsAssure: any,
        typeProduit: TypeProduit
    ): Promise<void> {
        if (!informationsAssure) {
            throw new BadRequestException('Informations de l\'assuré requises');
        }

        const champsRequis = [
            'nom_complet', 
            'telephone', 
            'adresse', 
            'type_piece_identite', 
            'numero_piece_identite'
        ];
        
        if (typeProduit === TypeProduit.VIE) {
            champsRequis.push('date_naissance');
        }

        for (const champ of champsRequis) {
            if (!informationsAssure[champ]) {
                throw new BadRequestException(`${champ} requis pour l'assuré`);
            }
        }
    }
}

