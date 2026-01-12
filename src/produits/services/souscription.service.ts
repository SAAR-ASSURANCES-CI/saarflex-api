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
import { AttestationService } from './attestation.service';
import { EmailService } from '../../users/email/email.service';
import { UserManagementService } from '../../users/services/user-management.service';
import { User } from '../../users/entities/user.entity';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly paiementService: PaiementService,
    private readonly contratService: ContratService,
    private readonly beneficiaireService: BeneficiaireService,
    private readonly attestationService: AttestationService,
    private readonly emailService: EmailService,
    private readonly userManagementService: UserManagementService,
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

    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId, utilisateur_id: utilisateurId },
      relations: ['produit', 'categorie']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }
    
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
    
    const contratExistant = await this.contratService.obtenirContratsUtilisateur('') 
      .then(contrats => contrats.find(c => c.devis_simule_id === devisId));

    const devis = await this.devisSimuleRepository.findOne({
      where: { id: devisId },
      relations: ['produit', 'categorie']
    });

    if (!devis) {
      throw new NotFoundException('Devis non trouvé');
    }

    if (devis.statut === StatutDevis.CONVERTI_EN_CONTRAT) {

      const c = await this.contratService.obtenirContratsUtilisateur(devis.utilisateur_id)
        .then(contrats => contrats.find(c => c.devis_simule_id === devisId));
      if (c) return c;
    }

    if (devis.statut !== StatutDevis.PAYE) {
      throw new BadRequestException('Le devis n\'est pas dans un état permettant la finalisation (attendu: PAYE)');
    }

    const paiement = await this.paiementService.obtenirPaiementParReference(paiementId);

    const contrat = await this.contratService.creerContratDepuisDevis(devisId);

    await this.paiementService.lierContrat(paiement.id, contrat.id);

    if (devis.produit.necessite_beneficiaires && paiement.donnees_callback?.beneficiaires) {
      await this.beneficiaireService.ajouterBeneficiaires(
        contrat.id,
        paiement.donnees_callback.beneficiaires
      );
    }

    // Envoi de l'attestation par email
    try {
      const user = await this.userRepository.findOne({ where: { id: contrat.utilisateur_id } });
      if (user) {
        const fullContrat = await this.contratService.obtenirContratParId(contrat.id);
        const pdfBuffer = await this.attestationService.genererAttestationPDF(fullContrat, user);

        await this.emailService.sendEmailWithAttachment(
          user.email,
          'Votre attestation de souscription - SAAR ASSURANCES CI',
          `<p>Bonjour ${user.nom},</p>
           <p>Nous vous remercions pour votre confiance. Vous trouverez ci-joint votre attestation de souscription pour le produit <strong>${fullContrat.produit?.nom}</strong>.</p>
           <p>Référence de votre contrat : <strong>${fullContrat.numero_contrat}</strong></p>
           <p>Cordialement,<br>L'équipe SAAR ASSURANCES CI</p>`,
          `attestation_${fullContrat.numero_contrat}.pdf`,
          pdfBuffer
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'attestation par email:', error);
    }

    // Notification aux agents
    this.notifierAgentsNouvelleSouscription(contrat, devis).catch(err => {
      console.error(`Erreur lors du déclenchement de la notification agent (souscription) : ${err.message}`);
    });

    return contrat;
  }

  /**
   * Notifie les agents d'une nouvelle souscription
   */
  private async notifierAgentsNouvelleSouscription(contrat: Contrat, devis: DevisSimule) {
    try {
      const agentsEmails = await this.userManagementService.findAgentsEmails();
      const clientNom = devis.informations_assure?.nom_complet || 'Client inconnu';
      const produitNom = devis.produit?.nom || 'Produit inconnu';

      await this.emailService.sendNewSubscriptionAgentNotification(
        agentsEmails,
        contrat.numero_contrat,
        produitNom,
        clientNom,
        Number(contrat.prime_mensuelle)
      );
    } catch (error) {
      console.error(`Erreur notification agents (souscription) : ${error.message}`);
    }
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

