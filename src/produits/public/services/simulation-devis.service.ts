import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../../entities/devis-simule.entity';
import { Produit, StatutProduit } from '../../entities/produit.entity';
import { GrilleTarifaire, StatutGrille } from '../../entities/grille-tarifaire.entity';
import { FormuleCalcul } from '../../entities/formule-calcul.entity';
import { Tarif } from '../../entities/tarif.entity';
import { CritereTarification } from '../../entities/critere-tarification.entity';
import { ValeurCritere } from '../../entities/valeur-critere.entity';
import { SimulationDevisDto, SimulationResponseDto } from '../../dto/simulation-devis.dto';

const DUREE_VALIDITE_SIMULATION = 24 * 60 * 60 * 1000;

@Injectable()
export class SimulationDevisService {
  constructor(
    @InjectRepository(DevisSimule)
    private devisSimuleRepository: Repository<DevisSimule>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(GrilleTarifaire)
    private grilleTarifaireRepository: Repository<GrilleTarifaire>,
    @InjectRepository(FormuleCalcul)
    private formuleCalculRepository: Repository<FormuleCalcul>,
    @InjectRepository(Tarif)
    private tarifRepository: Repository<Tarif>,
    @InjectRepository(CritereTarification)
    private critereTarificationRepository: Repository<CritereTarification>,
    @InjectRepository(ValeurCritere)
    private valeurCritereRepository: Repository<ValeurCritere>,
  ) { }

  async simulerDevis(
    simulationDto: SimulationDevisDto,
    utilisateurId?: string
  ): Promise<SimulationResponseDto> {
    // 1. Vérifier le produit
    const produit = await this.produitRepository.findOne({
      where: { id: simulationDto.produit_id, statut: StatutProduit.ACTIF },
      relations: ['criteres', 'formules', 'grilles']
    });

    if (!produit) {
      throw new NotFoundException('Produit non trouvé ou inactif');
    }

    // 2. Vérifier la grille tarifaire
    const grilleTarifaire = await this.grilleTarifaireRepository.findOne({
      where: {
        id: simulationDto.grille_tarifaire_id,
        produit_id: simulationDto.produit_id,
        statut: StatutGrille.ACTIF
      },
      relations: ['tarifs', 'tarifs.critere', 'tarifs.valeurCritere']
    });

    if (!grilleTarifaire) {
      throw new NotFoundException('Grille tarifaire non trouvée ou inactive');
    }

    // 3. Vérifier qu'une formule existe
    const formuleCalcul = produit.formules.find(f => f.statut === 'actif');
    if (!formuleCalcul) {
      throw new BadRequestException(
        `Aucune formule de calcul configurée pour le produit "${produit.nom}". ` +
        `Veuillez contacter l'administrateur pour configurer une formule.`
      );
    }

    // 4. Valider les critères utilisateur
    await this.validerCriteresUtilisateur(
      simulationDto.criteres_utilisateur,
      produit.criteres
    );

    // 5. Calculer la prime avec la formule
    const resultatCalcul = await this.calculerPrimeAvecFormule(
      formuleCalcul,
      grilleTarifaire,
      simulationDto.criteres_utilisateur,
      produit.criteres
    );

    // 6. Sauvegarder le devis
    const devisSimule = this.devisSimuleRepository.create({
      produit_id: simulationDto.produit_id,
      grille_tarifaire_id: simulationDto.grille_tarifaire_id,
      utilisateur_id: utilisateurId,
      criteres_utilisateur: simulationDto.criteres_utilisateur,
      prime_calculee: resultatCalcul.prime,
      franchise_calculee: resultatCalcul.franchise,
      plafond_calcule: resultatCalcul.plafond,
      statut: StatutDevis.SIMULATION,
      expires_at: new Date(Date.now() + DUREE_VALIDITE_SIMULATION),
    });

    const devisSauvegarde = await this.devisSimuleRepository.save(devisSimule);

    return {
      id: devisSauvegarde.id,
      prime_calculee: devisSauvegarde.prime_calculee,
      franchise_calculee: devisSauvegarde.franchise_calculee,
      plafond_calcule: devisSauvegarde.plafond_calcule,
      details_calcul: resultatCalcul.details,
      statut: devisSauvegarde.statut,
      expires_at: devisSauvegarde.expires_at,
      created_at: devisSauvegarde.created_at,
    };
  }

  private async validerCriteresUtilisateur(
    criteresUtilisateur: Record<string, any>,
    criteresProduit: CritereTarification[]
  ): Promise<void> {
    for (const critere of criteresProduit) {
      const valeurUtilisateur = criteresUtilisateur[critere.nom];

      if (critere.obligatoire && valeurUtilisateur === undefined) {
        throw new BadRequestException(`Le critère '${critere.nom}' est obligatoire`);
      }

      if (valeurUtilisateur !== undefined) {
        const valeursAutorisees = await this.valeurCritereRepository.find({
          where: { critere_id: critere.id }
        });

        if (valeursAutorisees.length > 0) {
          const valeursValides = valeursAutorisees.map(v => v.valeur);
          if (!valeursValides.includes(valeurUtilisateur)) {
            throw new BadRequestException(
              `Valeur invalide pour le critère '${critere.nom}'. Valeurs autorisées: ${valeursValides.join(', ')}`
            );
          }
        }
      }
    }
  }

  private async calculerPrimeAvecFormule(
    formuleCalcul: FormuleCalcul,
    grilleTarifaire: GrilleTarifaire,
    criteresUtilisateur: Record<string, any>,
    criteresProduit: CritereTarification[]
  ): Promise<{
    prime: number;
    franchise: number;
    plafond?: number;
    details: {
      formule_utilisee: string;
      variables_calculees: Record<string, any>;
      explication: string;
    };
  }> {
    try {
      // Préparations de toutes les variables pour la formule
      const variablesCalculees = await this.preparerVariables(
        criteresUtilisateur,
        grilleTarifaire.tarifs,
        criteresProduit
      );

      // Évaluer la formule principale pour la prime
      const prime = this.evaluerFormule(formuleCalcul.formule, variablesCalculees);
      
      // Pour la franchise et le plafond, on peut avoir des formules séparées ou des valeurs par défaut
      const franchise = this.calculerFranchise(variablesCalculees, formuleCalcul);
      const plafond = this.calculerPlafond(variablesCalculees, formuleCalcul);

      return {
        prime: Math.round(prime * 100) / 100,
        franchise: Math.round(franchise * 100) / 100,
        plafond: plafond ? Math.round(plafond * 100) / 100 : undefined,
        details: {
          formule_utilisee: formuleCalcul.nom,
          variables_calculees: variablesCalculees,
          explication: this.genererExplication(variablesCalculees, prime, franchise),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors du calcul avec la formule "${formuleCalcul.nom}": ${error.message}`
      );
    }
  }

  private async preparerVariables(
    criteresUtilisateur: Record<string, any>,
    tarifs: Tarif[],
    criteresProduit: CritereTarification[]
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = { ...criteresUtilisateur };

    // Ajouter les tarifs correspondants aux critères
    for (const tarif of tarifs) {
      if (tarif.critere_id) {
        const critere = criteresProduit.find(c => c.id === tarif.critere_id);
        if (critere && criteresUtilisateur[critere.nom] !== undefined) {
          const valeurUtilisateur = criteresUtilisateur[critere.nom];

          // Vérifier si ce tarif correspond à la valeur utilisateur
          if (tarif.valeur_critere_id && tarif.valeurCritere) {
            if (tarif.valeurCritere.valeur === valeurUtilisateur) {
              if (tarif.montant) variables[`tarif_${critere.nom}`] = tarif.montant;
              if (tarif.pourcentage) variables[`pourcentage_${critere.nom}`] = tarif.pourcentage;
            }
          } else if (!tarif.valeur_critere_id) {
            // Tarif général pour ce critère
            if (tarif.montant) variables[`tarif_${critere.nom}`] = tarif.montant;
            if (tarif.pourcentage) variables[`pourcentage_${critere.nom}`] = tarif.pourcentage;
          }
        }
      }
    }

    // Calculer l'âge si date de naissance fournie
    if (variables.date_naissance) {
      const dateNaissance = new Date(variables.date_naissance);
      const aujourdHui = new Date();
      variables.age = aujourdHui.getFullYear() - dateNaissance.getFullYear();

      if (aujourdHui < new Date(aujourdHui.getFullYear(), dateNaissance.getMonth(), dateNaissance.getDate())) {
        variables.age--;
      }
    }

    return variables;
  }

  private evaluerFormule(formule: string, variables: Record<string, any>): number {
    try {
      let formuleEvaluee = formule;

      // Remplacer les variables par leurs valeurs
      for (const [key, value] of Object.entries(variables)) {
        if (typeof value === 'number') {
          formuleEvaluee = formuleEvaluee.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
        }
      }

      const resultat = eval(formuleEvaluee);
      
      if (typeof resultat !== 'number' || isNaN(resultat) || !isFinite(resultat)) {
        throw new Error('La formule doit retourner un nombre valide');
      }

      return resultat;
    } catch (error) {
      throw new Error(`Erreur dans l'évaluation de la formule: ${error.message}`);
    }
  }

  private calculerFranchise(variables: Record<string, any>, formuleCalcul: FormuleCalcul): number {
    // Si une formule spécifique pour la franchise existe dans les variables de la formule
    if (formuleCalcul.variables?.formule_franchise) {
      try {
        return this.evaluerFormule(formuleCalcul.variables.formule_franchise, variables);
      } catch (error) {
        // Si erreur, utiliser valeur par défaut
      }
    }

    // Valeur par défaut de franchise
    return variables.franchise || 0;
  }

  private calculerPlafond(variables: Record<string, any>, formuleCalcul: FormuleCalcul): number | undefined {
    // Si une formule spécifique pour le plafond existe
    if (formuleCalcul.variables?.formule_plafond) {
      try {
        return this.evaluerFormule(formuleCalcul.variables.formule_plafond, variables);
      } catch (error) {
        // Si erreur, pas de plafond
      }
    }

    // Pas de plafond par défaut
    return variables.plafond || undefined;
  }

  private genererExplication(
    variables: Record<string, any>,
    prime: number,
    franchise: number
  ): string {
    let explication = `Calcul basé sur les critères fournis. `;

    if (variables.age) explication += `Âge: ${variables.age} ans. `;
    if (variables.profession) explication += `Profession: ${variables.profession}. `;
    if (variables.montant_assurance) explication += `Montant assuré: ${variables.montant_assurance} FCFA. `;
    if (variables.zone_geographique) explication += `Zone: ${variables.zone_geographique}. `;

    explication += `Prime calculée: ${prime} FCFA, Franchise: ${franchise} FCFA.`;

    return explication;
  }
}