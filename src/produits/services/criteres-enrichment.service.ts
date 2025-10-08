import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../users/entities/profile.entity';
import { TypeProduit } from '../entities/produit.entity';
import { CreateSimulationDevisSimplifieeDto } from '../dto/simulation-devis-simplifie.dto';
import { DateUtilsService } from '../../users/utils/date-utils.service';

/**
 * Service responsable de l'enrichissement des critères de tarification
 */
@Injectable()
export class CriteresEnrichmentService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        private readonly dateUtilsService: DateUtilsService,
    ) {}

    /**
     * Enrichit les critères avec l'âge calculé si nécessaire
     * @param criteres Critères fournis
     * @param simulationDto DTO de simulation
     * @param utilisateurId ID utilisateur (optionnel)
     * @param typeProduit Type de produit
     */
    async enrichirCriteresAvecAge(
        criteres: Record<string, any>,
        simulationDto: CreateSimulationDevisSimplifieeDto,
        utilisateurId: string | null,
        typeProduit: TypeProduit
    ): Promise<Record<string, any>> {
        
        const criteresEnrichis = { ...criteres };

        if (typeProduit === TypeProduit.VIE) {
            const dateNaissance = await this.obtenirDateNaissance(
                simulationDto, 
                utilisateurId
            );

            const age = this.dateUtilsService.calculateAge(dateNaissance);
            
            criteresEnrichis['Age Assuré'] = age.toString();
            
            // Supprimer l'ancien champ 'age' si présent
            if ('age' in criteresEnrichis) {
                delete criteresEnrichis.age;
            }
        }

        return criteresEnrichis;
    }

    /**
     * Obtient la date de naissance depuis le profil ou le DTO
     * @param simulationDto DTO de simulation
     * @param utilisateurId ID utilisateur
     */
    private async obtenirDateNaissance(
        simulationDto: CreateSimulationDevisSimplifieeDto,
        utilisateurId: string | null
    ): Promise<Date> {
        if (simulationDto.assure_est_souscripteur && utilisateurId) {
            return await this.obtenirDateNaissanceDepuisProfil(utilisateurId);
        } else {
            return this.obtenirDateNaissanceDepuisDto(simulationDto);
        }
    }

    /**
     * Obtient la date de naissance depuis le profil utilisateur
     * @param utilisateurId ID utilisateur
     */
    private async obtenirDateNaissanceDepuisProfil(utilisateurId: string): Promise<Date> {
        const profile = await this.profileRepository.findOne({
            where: { user_id: utilisateurId }
        });
        
        if (!profile || !profile.date_naissance) {
            throw new BadRequestException('Date de naissance manquante dans le profil utilisateur');
        }
        
        const dateNaissance = new Date(profile.date_naissance);
        
        if (isNaN(dateNaissance.getTime())) {
            throw new BadRequestException(`Date de naissance invalide dans le profil: ${profile.date_naissance}`);
        }

        return dateNaissance;
    }

    /**
     * Obtient la date de naissance depuis le DTO
     * @param simulationDto DTO de simulation
     */
    private obtenirDateNaissanceDepuisDto(
        simulationDto: CreateSimulationDevisSimplifieeDto
    ): Date {
        if (!simulationDto.informations_assure?.date_naissance) {
            throw new BadRequestException('Date de naissance requise pour l\'assuré');
        }
        
        const dateStr = simulationDto.informations_assure.date_naissance;
        return this.parserDateNaissance(dateStr);
    }

    /**
     * Parse une date de naissance depuis différents formats
     * @param dateStr Chaîne de date
     */
    private parserDateNaissance(dateStr: string | Date): Date {
        let parsedDate: Date;
        
        if (typeof dateStr === 'string') {
            
            if (dateStr.includes('-') && dateStr.split('-').length === 3 && dateStr.split('-')[0].length <= 2) {
                const parsed = this.dateUtilsService.parseDDMMYYYY(dateStr);
                if (parsed) {
                    return parsed;
                }
            }
            
            // Format ISO YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                parsedDate = new Date(dateStr);
            } else {
                
                parsedDate = new Date(dateStr);
            }
        } else {
            parsedDate = new Date(dateStr);
        }
        
        if (isNaN(parsedDate.getTime())) {
            throw new BadRequestException(
                `Format de date invalide: ${dateStr}. Utilisez DD-MM-YYYY ou YYYY-MM-DD`
            );
        }
        
        return parsedDate;
    }
}

