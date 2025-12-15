import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../entities/devis-simule.entity';
import { Contrat } from '../entities/contrat.entity';
import { Paiement, MethodePaiement } from '../entities/paiement.entity';
import { PaiementService } from './paiement.service';
import { ContratService } from './contrat.service';
import { BeneficiaireService } from './beneficiaire.service';
import { Beneficiaire } from '../entities/beneficiaire.entity';

/**
 * Service orchestrateur du processus de souscription
 * Gère le flux complet : validation -> bénéficiaires -> paiement -> contrat
 */
@Injectable()
export class SouscriptionService {

  constructor(
    @InjectRepository(DevisSimule)
    private readonly devisSimuleRepository: Repository<DevisSimule>,
    @InjectRepository(Beneficiaire)
    private readonly beneficiaireRepository: Repository<Beneficiaire>,
    private readonly paiementService: PaiementService,
    private readonly contratService: ContratService,
    private readonly beneficiaireService: BeneficiaireService,
  ) { }

  /**
   * Lance le processus de souscription pour un devis
   * 1. Valide le devis
   * 2. Valide les bénéficiaires si nécessaire
   * 3. Initie le paiement
   * Note: Les bénéficiaires seront créés APRÈS le paiement réussi, directement pour le contrat
   */
  async souscrireDevis(
    devisId: string,
    utilisateurId: string,
    methodePaiement: MethodePaiement,
    numeroTelephone?: string,
    beneficiaires?: Array<{ nom_complet: string, lien_souscripteur: string, ordre: number }>,
    currency: string = 'XOF'
  ): Promise<{
    paiement: Paiement;
    message: string;
    beneficiaires?: Array<{ nom_complet: string, lien_souscripteur: string, ordre: number }>;
  }> {

    //récupération du devis
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId, utilisateur_id: utilisateurId },
      relations: ['produit', 'categorie']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    //vérification si le produit nécessite des bénéficiaires
    if (devis.produit.necessite_beneficiaires) {
      if (!beneficiaires || beneficiaires.length === 0) {
        throw new BadRequestException('Ce produit nécessite au moins un bénéficiaire');
      }

      if (devis.produit.max_beneficiaires > 0 && beneficiaires.length > devis.produit.max_beneficiaires) {
        throw new BadRequestException(
          `Nombre maximum de bénéficiaires dépassé (max: ${devis.produit.max_beneficiaires})`
        );
      }
    }

    //initialisation du paiement
    const paiement = await this.paiementService.initierPaiement(
      devisId,
      utilisateurId,
      Number(devis.prime_calculee),
      methodePaiement,
      numeroTelephone,
      currency
    );

    if (beneficiaires && beneficiaires.length > 0) {
      paiement.donnees_callback = { beneficiaires };
      await this.devisSimuleRepository.manager.save(paiement);
    }

    return {
      paiement,
      message: 'Paiement initié avec succès. En attente de confirmation.',
      beneficiaires
    };
  }

  /**
   * Finalise la souscription après paiement réussi
   * Appelé par le webhook de paiement
   */
  async finaliserSouscription(devisId: string, paiementId: string): Promise<Contrat> {

    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId, statut: StatutDevis.PAYE },
      relations: ['produit', 'categorie']
    });

    if (!devis) {
      throw new NotFoundException('Devis payé non trouvé');
    }

    const paiement = await this.paiementService.obtenirPaiementParReference(paiementId);

    const contrat = await this.contratService.creerContratDepuisDevis(devisId);

    if (devis.produit.necessite_beneficiaires && paiement.donnees_callback?.beneficiaires) {
      await this.beneficiaireService.ajouterBeneficiaires(
        contrat.id,
        paiement.donnees_callback.beneficiaires
      );
    }

    return contrat;
  }

  /**
   * Annule une souscription (si paiement échoué)
   */
  async annulerSouscription(devisId: string): Promise<void> {
    await this.devisSimuleRepository.update(
      { id: devisId },
      { statut: StatutDevis.SAUVEGARDE }
    );
  }

  /**
   * Récupère l'état de la souscription
   */
  async obtenirEtatSouscription(devisId: string, utilisateurId: string): Promise<{
    devis: DevisSimule;
    paiement?: Paiement;
    contrat?: Contrat;
  }> {
    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId, utilisateur_id: utilisateurId },
      relations: ['produit', 'categorie']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    const result: any = { devis };

    const paiements = await this.paiementService.obtenirPaiementsUtilisateur(utilisateurId);
    const paiement = paiements.find(p => p.devis_simule_id === devisId);

    if (paiement) {
      result.paiement = paiement;
    }

    if (devis.statut === StatutDevis.CONVERTI_EN_CONTRAT) {
      const contrats = await this.contratService.obtenirContratsUtilisateur(utilisateurId);
      const contrat = contrats.find(c => c.devis_simule_id === devisId);

      if (contrat) {
        result.contrat = contrat;
      }
    }

    return result;
  }
}

