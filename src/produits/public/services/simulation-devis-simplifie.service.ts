import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit, StatutProduit } from '../../entities/produit.entity';
import {
  CreateSimulationDevisSimplifieeDto,
  SimulationDevisSimplifieeResponseDto,
} from '../../dto/simulation-devis-simplifie.dto';
import { DevisValidationService } from '../../services/devis-validation.service';
import { TarifCalculationService } from '../../services/tarif-calculation.service';
import { CriteresEnrichmentService } from '../../services/criteres-enrichment.service';
import { DevisCreationService } from '../../services/devis-creation.service';
import { DevisMapperService } from '../../services/devis-mapper.service';

/**
 * Service orchestrateur pour la simulation de devis simplifiée
 * Délègue les opérations aux services spécialisés
 * 
 * Cette architecture permet :
 * - Séparation des responsabilités (SOLID)
 * - Meilleure testabilité
 * - Réutilisabilité des services
 * - Code plus maintenable
 */
@Injectable()
export class SimulationDevisSimplifieeService {
  constructor(
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
    private readonly devisValidationService: DevisValidationService,
    private readonly tarifCalculationService: TarifCalculationService,
    private readonly criteresEnrichmentService: CriteresEnrichmentService,
    private readonly devisCreationService: DevisCreationService,
    private readonly devisMapperService: DevisMapperService,
  ) { }

  /**
   * Simule un devis avec le système simplifié
   * @param simulationDto Données de simulation
   * @param utilisateurId ID utilisateur (optionnel)
   */
  async simulerDevisSimple(
    simulationDto: CreateSimulationDevisSimplifieeDto,
    utilisateurId?: string
  ): Promise<SimulationDevisSimplifieeResponseDto> {

    // 1. Récupérer et valider le produit
    const produit = await this.produitRepository.findOne({
      where: { id: simulationDto.produit_id, statut: StatutProduit.ACTIF },
      relations: ['criteres', 'grilles', 'categorie']
    });

    if (!produit) {
      throw new NotFoundException('Produit non trouvé ou inactif');
    }

    // 2. Valider les données de souscription
    if (utilisateurId) {
      await this.devisValidationService.validerSouscription(simulationDto, utilisateurId, produit);
    } else if (simulationDto.assure_est_souscripteur) {
      throw new BadRequestException('Authentification requise pour les simulations "pour moi-même"');
    }

    // 3. Trouver la grille tarifaire active
    const grilleTarifaire = await this.tarifCalculationService.trouverGrilleTarifaireActive(produit.id);

    // 4. Enrichir les critères avec l'âge si nécessaire
    const criteresEnrichis = await this.criteresEnrichmentService.enrichirCriteresAvecAge(
      simulationDto.criteres_utilisateur,
      simulationDto,
      utilisateurId || null,
      produit.type
    );

    // 5. Trouver le tarif correspondant
    const tarifFixe = await this.tarifCalculationService.trouverTarifFixe(
      grilleTarifaire.id,
      criteresEnrichis
    );

    // 6. Créer le devis simulé
    const devisSimule = await this.devisCreationService.creerDevisSimule(
      simulationDto,
      produit,
      grilleTarifaire,
      tarifFixe.montant_fixe,
      criteresEnrichis,
      utilisateurId
    );

    // 7. Mapper et retourner la réponse
    return await this.devisMapperService.mapToResponseDto(
      devisSimule,
      produit,
      tarifFixe.montant_fixe,
      utilisateurId
    );
  }
}
