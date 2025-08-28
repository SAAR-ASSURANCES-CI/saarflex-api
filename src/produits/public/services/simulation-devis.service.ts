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
import {
  FORMULES_CALCUL_DEFAUT,
  FRANCHISES_DEFAUT,
  PLAFONDS_DEFAUT,
  DUREE_VALIDITE_SIMULATION
} from '../../config/formules-calcul.config';

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
    const produit = await this.produitRepository.findOne({
      where: { id: simulationDto.produit_id, statut: StatutProduit.ACTIF },
      relations: ['criteres', 'formules', 'grilles']
    });

    if (!produit) {
      throw new NotFoundException('Produit non trouve ou inactif');
    }

    const grilleTarifaire = await this.grilleTarifaireRepository.findOne({
      where: {
        id: simulationDto.grille_tarifaire_id,
        produit_id: simulationDto.produit_id,
        statut: StatutGrille.ACTIF
      },
      relations: ['tarifs', 'tarifs.critere', 'tarifs.valeurCritere']
    });

    if (!grilleTarifaire) {
      throw new NotFoundException('Grille tarifaire non trouvee ou inactive');
    }

    await this.validerCriteresUtilisateur(
      simulationDto.criteres_utilisateur,
      produit.criteres
    );

    const resultatCalcul = await this.calculerPrime(
      produit,
      grilleTarifaire,
      simulationDto.criteres_utilisateur
    );

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
        throw new BadRequestException(`Le critere '${critere.nom}' est obligatoire`);
      }

      if (valeurUtilisateur !== undefined) {
        const valeursAutorisees = await this.valeurCritereRepository.find({
          where: { critere_id: critere.id }
        });

        if (valeursAutorisees.length > 0) {
          const valeursValides = valeursAutorisees.map(v => v.valeur);
          if (!valeursValides.includes(valeurUtilisateur)) {
            throw new BadRequestException(
              `Valeur invalide pour le critere '${critere.nom}'. Valeurs autorisees: ${valeursValides.join(', ')}`
            );
          }
        }
      }
    }
  }

  private async calculerPrime(
    produit: Produit,
    grilleTarifaire: GrilleTarifaire,
    criteresUtilisateur: Record<string, any>
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
    const formuleCalcul = produit.formules.find(f => f.statut === 'actif');

    const variablesCalculees = await this.calculerVariables(
      criteresUtilisateur,
      grilleTarifaire.tarifs,
      produit.criteres
    );

    let prime = 0;
    let franchise = 0;
    let plafond: number | undefined;

    try {
      if (formuleCalcul) {
        prime = this.evaluerFormulePersonnalisee(formuleCalcul.formule, variablesCalculees);
        franchise = this.calculerFranchisePersonnalisee(variablesCalculees, produit.type);
        plafond = this.calculerPlafondPersonnalisee(variablesCalculees, produit.type);
      } else {
        const montantFixe = this.calculerPrimeMontantFixe(
          grilleTarifaire.tarifs,
          criteresUtilisateur,
          produit.criteres
        );

        if (montantFixe !== null) {
          prime = montantFixe;
          franchise = this.calculerFranchisePersonnalisee(variablesCalculees, produit.type);
          plafond = this.calculerPlafondPersonnalisee(variablesCalculees, produit.type);
        } else {
          const typeProduit = this.determinerTypeAssurance(produit.nom, produit.type);
          const formuleDefaut = FORMULES_CALCUL_DEFAUT[typeProduit];

          if (formuleDefaut) {
            prime = this.evaluerFormulePersonnalisee(formuleDefaut.formule, variablesCalculees);
            franchise = FRANCHISES_DEFAUT[typeProduit] || 0;
            plafond = PLAFONDS_DEFAUT[typeProduit] ?
              variablesCalculees.montant_assurance * PLAFONDS_DEFAUT[typeProduit] : undefined;
          } else {
            prime = this.calculerPrimeFallback(variablesCalculees);
            franchise = this.calculerFranchiseFallback(variablesCalculees);
            plafond = this.calculerPlafondFallback(variablesCalculees);
          }
        }
      }
    } catch (error) {
      throw new BadRequestException(`Erreur lors du calcul de la prime: ${error.message}`);
    }

    return {
      prime: Math.round(prime * 100) / 100,
      franchise: Math.round(franchise * 100) / 100,
      plafond: plafond ? Math.round(plafond * 100) / 100 : undefined,
      details: {
        formule_utilisee: formuleCalcul?.nom || 'Formule par defaut',
        variables_calculees: variablesCalculees,
        explication: this.genererExplicationCalcul(variablesCalculees, prime, franchise),
      },
    };
  }

  private async calculerVariables(
    criteresUtilisateur: Record<string, any>,
    tarifs: Tarif[],
    criteres: CritereTarification[]
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = { ...criteresUtilisateur };

    for (const tarif of tarifs) {
      if (tarif.critere_id) {
        const critere = criteres.find(c => c.id === tarif.critere_id);
        if (critere && criteresUtilisateur[critere.nom] !== undefined) {
          const valeur = criteresUtilisateur[critere.nom];

          if (tarif.montant) {
            variables[`tarif_${critere.nom}`] = tarif.montant;
          }
          if (tarif.pourcentage) {
            variables[`pourcentage_${critere.nom}`] = tarif.pourcentage;
          }
          if (tarif.formule) {
            variables[`formule_${critere.nom}`] = tarif.formule;
          }
        }
      }
    }

    if (variables.date_naissance) {
      const dateNaissance = new Date(variables.date_naissance);
      const aujourdHui = new Date();
      variables.age = aujourdHui.getFullYear() - dateNaissance.getFullYear();

      if (aujourdHui < new Date(aujourdHui.getFullYear(), dateNaissance.getMonth(), dateNaissance.getDate())) {
        variables.age--;
      }
    }

    this.appliquerCoefficientsDefaut(variables);

    return variables;
  }

  private appliquerCoefficientsDefaut(variables: Record<string, any>): void {
    if (variables.age) {
      if (variables.age < 25) variables.coef_age = 1.2;
      else if (variables.age < 35) variables.coef_age = 1.0;
      else if (variables.age < 50) variables.coef_age = 0.9;
      else if (variables.age < 65) variables.coef_age = 1.1;
      else variables.coef_age = 1.4;
    }

    if (variables.profession) {
      const coefProfession: Record<string, number> = {
        'etudiant': 0.8,
        'employe': 1.0,
        'cadre': 1.1,
        'dirigeant': 1.2,
        'retraite': 1.3
      };
      variables.coef_profession = coefProfession[variables.profession] || 1.0;
    }

    if (variables.zone_geographique) {
      const coefZone: Record<string, number> = {
        'zone1': 1.0,
        'zone2': 1.1,
        'zone3': 1.2,
        'zone4': 1.3
      };
      variables.coef_zone = coefZone[variables.zone_geographique] || 1.0;
    }
  }

  private determinerTypeAssurance(nomProduit: string, typeProduit: string): string {
    const nomLower = nomProduit.toLowerCase();

    if (nomLower.includes('vie') || typeProduit === 'vie') return 'assurance_vie';
    if (nomLower.includes('auto') || nomLower.includes('vehicule')) return 'assurance_auto';
    if (nomLower.includes('sante') || nomLower.includes('medical')) return 'assurance_sante';
    if (nomLower.includes('habitation') || nomLower.includes('maison')) return 'assurance_habitation';

    return 'assurance_vie';
  }

  private evaluerFormulePersonnalisee(
    formule: string,
    variables: Record<string, any>
  ): number {
    try {
      let formuleEvaluee = formule;

      for (const [key, value] of Object.entries(variables)) {
        if (typeof value === 'number') {
          formuleEvaluee = formuleEvaluee.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
        }
      }

      return eval(formuleEvaluee);
    } catch (error) {
      throw new Error(`Erreur dans la formule: ${error.message}`);
    }
  }

  private calculerFranchisePersonnalisee(
    variables: Record<string, any>,
    typeProduit: string
  ): number {
    if (typeProduit === 'vie') return 0;

    let franchise = variables.franchise_base || 100;

    if (variables.montant_assurance) {
      franchise = Math.min(variables.montant_assurance * 0.05, 500);
    }

    if (variables.age) {
      if (variables.age > 65) franchise *= 1.2;
      else if (variables.age < 25) franchise *= 1.1;
    }

    return Math.round(franchise * 100) / 100;
  }

  private calculerPlafondPersonnalisee(
    variables: Record<string, any>,
    typeProduit: string
  ): number | undefined {
    if (!variables.montant_assurance) return undefined;

    let plafond = variables.montant_assurance;

    if (typeProduit === 'vie') {
      plafond *= 1.5;
    } else if (typeProduit === 'non-vie') {
      plafond *= 1.2;
    }

    return Math.round(plafond * 100) / 100;
  }

  private calculerPrimeFallback(variables: Record<string, any>): number {
    let prime = variables.prime_base || 100;

    if (variables.coef_age) prime *= variables.coef_age;
    if (variables.coef_profession) prime *= variables.coef_profession;
    if (variables.coef_zone) prime *= variables.coef_zone;

    if (variables.montant_assurance) {
      prime += (variables.montant_assurance / 10000) * 10;
    }

    return prime;
  }

  private calculerFranchiseFallback(variables: Record<string, any>): number {
    let franchise = 100;

    if (variables.montant_assurance) {
      franchise = Math.min(variables.montant_assurance * 0.05, 500);
    }

    return franchise;
  }

  private calculerPlafondFallback(variables: Record<string, any>): number | undefined {
    return variables.montant_assurance ? variables.montant_assurance * 1.2 : undefined;
  }

  private genererExplicationCalcul(
    variables: Record<string, any>,
    prime: number,
    franchise: number
  ): string {
    let explication = `Calcul base sur les criteres fournis. `;

    if (variables.age) {
      explication += `Age: ${variables.age} ans. `;
    }

    if (variables.profession) {
      explication += `Profession: ${variables.profession}. `;
    }

    if (variables.montant_assurance) {
      explication += `Montant assure: ${variables.montant_assurance}€. `;
    }

    if (variables.zone_geographique) {
      explication += `Zone: ${variables.zone_geographique}. `;
    }

    explication += `Prime calculee: ${prime} FCFA, Franchise: ${franchise} FCFA.`;

    return explication;
  }



  private calculerPrimeMontantFixe(
    tarifs: Tarif[],
    criteresUtilisateur: Record<string, any>,
    criteres: CritereTarification[]
  ): number | null {

    const tarifsCapital: Tarif[] = [];

    for (const tarif of tarifs) {
      if (tarif.critere_id && tarif.montant && !tarif.formule) {
        const critere = criteres.find(c => c.id === tarif.critere_id);

        if (critere && critere.nom === "Capital assuré" &&
          criteresUtilisateur[critere.nom] !== undefined) {
          if (tarif.valeur_critere_id && tarif.valeurCritere) {
            if (tarif.valeurCritere.valeur === criteresUtilisateur[critere.nom]) {
              tarifsCapital.push(tarif);
            }
          }
        }
      }
    }
    if (tarifsCapital.length > 0) {
      tarifsCapital.sort((a: Tarif, b: Tarif) => {
        return Number(b.montant) - Number(a.montant);
      });
      return Number(tarifsCapital[0].montant);
    }

    return null;
  }
}
