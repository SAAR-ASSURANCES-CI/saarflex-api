import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisSimule, StatutDevis } from '../../entities/devis-simule.entity';
import { Produit, StatutProduit, TypeProduit } from '../../entities/produit.entity';
import { GrilleTarifaire, StatutGrille } from '../../entities/grille-tarifaire.entity';
import { Tarif } from '../../entities/tarif.entity';
import { CritereTarification } from '../../entities/critere-tarification.entity';
import { ValeurCritere } from '../../entities/valeur-critere.entity';
import { Beneficiaire } from '../../entities/beneficiaire.entity';
import { DocumentIdentite } from '../../entities/document-identite.entity';
import { Profile } from '../../../users/entities/profile.entity';
import { User } from '../../../users/entities/user.entity';
import { 
  CreateSimulationDevisSimplifieeDto, 
  SimulationDevisSimplifieeResponseDto,
  InformationsAssureDto 
} from '../../dto/simulation-devis-simplifie.dto';

const DUREE_VALIDITE_SIMULATION = 24 * 60 * 60 * 1000;

@Injectable()
export class SimulationDevisSimplifieeService {
  constructor(
    @InjectRepository(DevisSimule)
    private devisSimuleRepository: Repository<DevisSimule>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(GrilleTarifaire)
    private grilleTarifaireRepository: Repository<GrilleTarifaire>,
    @InjectRepository(Tarif)
    private tarifRepository: Repository<Tarif>,
    @InjectRepository(CritereTarification)
    private critereTarificationRepository: Repository<CritereTarification>,
    @InjectRepository(ValeurCritere)
    private valeurCritereRepository: Repository<ValeurCritere>,
    @InjectRepository(Beneficiaire)
    private beneficiaireRepository: Repository<Beneficiaire>,
    @InjectRepository(DocumentIdentite)
    private documentRepository: Repository<DocumentIdentite>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  /**
   * Simule un devis avec le nouveau système simplifié
   */
  async simulerDevisSimple(
    simulationDto: CreateSimulationDevisSimplifieeDto,
    utilisateurId?: string
  ): Promise<SimulationDevisSimplifieeResponseDto> {
    
    // 1. Vérifier le produit
    const produit = await this.produitRepository.findOne({
      where: { id: simulationDto.produit_id, statut: StatutProduit.ACTIF },
      relations: ['criteres', 'grilles']
    });

    if (!produit) {
      throw new NotFoundException('Produit non trouvé ou inactif');
    }

    // 2. Validation spécifique selon le type de souscription
    if (utilisateurId) {
      await this.validerSouscription(simulationDto, utilisateurId, produit);
    } else if (simulationDto.assure_est_souscripteur) {
      throw new BadRequestException('Authentification requise pour les simulations "pour moi-même"');
    }

    // 3. Trouver la grille tarifaire active
    const grilleTarifaire = await this.trouverGrilleTarifaireActive(produit.id);

    // 4. Calculer l'âge si c'est un produit Vie et si nécessaire
    const criteresEnrichis = await this.enrichirCriteresAvecAge(
      simulationDto.criteres_utilisateur,
      simulationDto,
      utilisateurId || null,
      produit.type
    );

    // 5. Trouver le tarif fixe correspondant
    const tarifFixe = await this.trouverTarifFixe(grilleTarifaire.id, criteresEnrichis);

    // 6. Créer le devis simulé
    const devisSimule = await this.creerDevisSimule(
      simulationDto,
      produit,
      grilleTarifaire,
      tarifFixe.montant_fixe,
      criteresEnrichis,
      utilisateurId
    );

    if (produit.necessite_beneficiaires && simulationDto.beneficiaires && simulationDto.beneficiaires.length > 0) {
      await this.ajouterBeneficiaires(devisSimule.id, simulationDto.beneficiaires);
    }

    return await this.mapToResponseDto(devisSimule, produit, tarifFixe.montant_fixe, utilisateurId);
  }

  /**
   * Valide les données de souscription selon le type (pour soi-même ou autre personne)
   */
  private async validerSouscription(
    simulationDto: CreateSimulationDevisSimplifieeDto,
    utilisateurId: string,
    produit: Produit
  ): Promise<void> {
    
    if (simulationDto.assure_est_souscripteur) {
      // Vérification que l'utilisateur a un profil complet
      if (!utilisateurId) {
        throw new BadRequestException('Utilisateur non authentifié');
      }

      const profile = await this.profileRepository.findOne({
        where: { user_id: utilisateurId }
      });

      if (!profile) {
        throw new BadRequestException('Profil utilisateur non trouvé. Veuillez compléter votre profil.');
      }

      // Vérifications spécifiques selon le type de produit
      if (produit.type === TypeProduit.VIE) {
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

    } else {
      // Validation pour "autre personne"
      if (!simulationDto.informations_assure) {
        throw new BadRequestException('Informations de l\'assuré requises');
      }

      const infos = simulationDto.informations_assure;
      const champsRequis = ['nom_complet', 'telephone', 'adresse', 'type_piece_identite', 'numero_piece_identite'];
      
      if (produit.type === TypeProduit.VIE) {
        champsRequis.push('date_naissance');
      }

      for (const champ of champsRequis) {
        if (!infos[champ]) {
          throw new BadRequestException(`${champ} requis pour l'assuré`);
        }
      }
    }
  }

  /**
   * Trouve la grille tarifaire active pour un produit
   */
  private async trouverGrilleTarifaireActive(produitId: string): Promise<GrilleTarifaire> {
    const grille = await this.grilleTarifaireRepository.findOne({
      where: {
        produit_id: produitId,
        statut: StatutGrille.ACTIF
      },
      relations: ['tarifs']
    });

    if (!grille) {
      throw new NotFoundException('Aucune grille tarifaire active trouvée pour ce produit');
    }

    return grille;
  }

  /**
   * Enrichit les critères avec l'âge calculé si nécessaire
   */
  private async enrichirCriteresAvecAge(
    criteres: Record<string, any>,
    simulationDto: CreateSimulationDevisSimplifieeDto,
    utilisateurId: string | null,
    typeProduit: TypeProduit
  ): Promise<Record<string, any>> {
    
    const criteresEnrichis = { ...criteres };

    if (typeProduit === TypeProduit.VIE) {
      let dateNaissance: Date;

      if (simulationDto.assure_est_souscripteur && utilisateurId) {
        // Récupérer la date de naissance du profil utilisateur
        const profile = await this.profileRepository.findOne({
          where: { user_id: utilisateurId }
        });
        
        if (!profile || !profile.date_naissance) {
          throw new BadRequestException('Date de naissance manquante dans le profil utilisateur');
        }
        
        dateNaissance = new Date(profile.date_naissance);
        
        if (isNaN(dateNaissance.getTime())) {
          throw new BadRequestException(`Date de naissance invalide dans le profil: ${profile.date_naissance}`);
        }
      } else {
        if (!simulationDto.informations_assure?.date_naissance) {
          throw new BadRequestException('Date de naissance requise pour l\'assuré');
        }
        
        const dateStr = simulationDto.informations_assure.date_naissance;
        let parsedDate: Date;
        
        if (typeof dateStr === 'string') {
          if (dateStr.includes('-') && dateStr.split('-').length === 3) {
            const [jour, mois, annee] = dateStr.split('-');
            parsedDate = new Date(parseInt(annee), parseInt(mois) - 1, parseInt(jour));
          } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            parsedDate = new Date(dateStr);
          } else {
            parsedDate = new Date(dateStr);
          }
        } else {
          parsedDate = new Date(dateStr);
        }
        
        if (isNaN(parsedDate.getTime())) {
          throw new BadRequestException(`Format de date invalide: ${dateStr}. Utilisez DD-MM-YYYY ou YYYY-MM-DD`);
        }
        
        dateNaissance = parsedDate;
      }

      const age = this.calculerAge(dateNaissance);
      
      criteresEnrichis['Age Assuré'] = age.toString();
      
      // Supprimer l'ancien critère 'age' s'il existe
      if ('age' in criteresEnrichis) {
        delete criteresEnrichis.age;
      }
    }

    return criteresEnrichis;
  }

  /**
   * Calcule l'âge à partir d'une date de naissance
   */
  private calculerAge(dateNaissance: Date): number {
    const aujourd = new Date();
    let age = aujourd.getFullYear() - dateNaissance.getFullYear();
    const moisDiff = aujourd.getMonth() - dateNaissance.getMonth();
    
    if (moisDiff < 0 || (moisDiff === 0 && aujourd.getDate() < dateNaissance.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Trouve le tarif fixe correspondant aux critères
   */
  private async trouverTarifFixe(
    grilleId: string,
    criteres: Record<string, any>
  ): Promise<Tarif> {
    const tarifsAvecCriteresCombines = await this.tarifRepository.find({
      where: { grille_id: grilleId },
      select: ['id', 'montant_fixe', 'criteres_combines']
    });

    for (const tarif of tarifsAvecCriteresCombines) {
      if (tarif.criteres_combines) {
        let correspondanceComplete = true;
        
        for (const [nomCritere, valeurAttendue] of Object.entries(tarif.criteres_combines)) {
          const critereKey = Object.keys(criteres).find(key => 
            key.toLowerCase() === nomCritere.toLowerCase()
          );
          const valeurFournie = critereKey ? criteres[critereKey] : undefined;
          
          if (!valeurFournie || valeurFournie.toString() !== valeurAttendue.toString()) {
            correspondanceComplete = false;
            break;
          }
        }
        
        if (correspondanceComplete) {
          const tarifTrouve = await this.tarifRepository.findOne({
            where: { id: tarif.id }
          });
          
          if (tarifTrouve) {
            return tarifTrouve;
          }
        }
      }
    }

    const queryBuilder = this.tarifRepository
      .createQueryBuilder('tarif')
      .leftJoinAndSelect('tarif.critere', 'critere')
      .leftJoinAndSelect('tarif.valeurCritere', 'valeurCritere')
      .where('tarif.grille_id = :grilleId', { grilleId });

    let paramIndex = 0;
    for (const [nomCritere, valeur] of Object.entries(criteres)) {
      const paramKey = `param${paramIndex}`;
      queryBuilder
        .andWhere(`critere.nom = :nomCritere${paramKey}`, { [`nomCritere${paramKey}`]: nomCritere })
        .andWhere(`valeurCritere.valeur = :valeur${paramKey}`, { [`valeur${paramKey}`]: valeur.toString() });
      paramIndex++;
    }

    const tarif = await queryBuilder.getOne();

    if (!tarif) {
      throw new NotFoundException(
        `Aucun tarif trouvé pour les critères: ${JSON.stringify(criteres)}`
      );
    }

    return tarif;
  }

  /**
   * Crée le devis simulé en base
   */
  private async creerDevisSimule(
    simulationDto: CreateSimulationDevisSimplifieeDto,
    produit: Produit,
    grilleTarifaire: GrilleTarifaire,
    primeCalculee: number,
    criteres: Record<string, any>,
    utilisateurId?: string
  ): Promise<DevisSimule> {
    
    let informationsAssure: Record<string, any> | undefined = undefined;
    
    if (simulationDto.assure_est_souscripteur && utilisateurId) {
      const profile = await this.profileRepository.findOne({
        where: { user_id: utilisateurId },
        relations: ['user']
      });
      
      if (profile) {
        informationsAssure = {
          nom_complet: `${profile.user?.nom || ''}`.trim(),
          date_naissance: profile.date_naissance?.toString() || '',
          type_piece_identite: profile.type_piece_identite || '',
          numero_piece_identite: profile.numero_piece_identite || '',
          email: profile.user?.email || '',
          telephone: profile.user?.telephone || '',
          adresse: profile.adresse || ''
        };
      }
    } else if (!simulationDto.assure_est_souscripteur && simulationDto.informations_assure) {
      informationsAssure = simulationDto.informations_assure;
    }
    
    const devisData: Partial<DevisSimule> = {
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

    const devis = this.devisSimuleRepository.create(devisData);
    return await this.devisSimuleRepository.save(devis);
  }

  /**
   * Ajoute les bénéficiaires au devis
   */
  private async ajouterBeneficiaires(
    devisId: string,
    beneficiaires: Array<{nom_complet: string, lien_souscripteur: string, ordre: number}>
  ): Promise<void> {
    for (const beneficiaireData of beneficiaires) {
      const beneficiaire = this.beneficiaireRepository.create({
        devis_simule_id: devisId,
        nom_complet: beneficiaireData.nom_complet,
        lien_souscripteur: beneficiaireData.lien_souscripteur,
        ordre: beneficiaireData.ordre
      });

      await this.beneficiaireRepository.save(beneficiaire);
    }
  }

  /**
   * Mappe le résultat vers le DTO de réponse
   */
  private async mapToResponseDto(
    devis: DevisSimule,
    produit: Produit,
    primeCalculee: number,
    utilisateurId?: string
  ): Promise<SimulationDevisSimplifieeResponseDto> {
    
    const informationsAssure = devis.informations_assure as InformationsAssureDto | undefined;
    const beneficiaires = await this.beneficiaireRepository.find({
      where: { devis_simule_id: devis.id },
      order: { ordre: 'ASC' }
    });
    
    const beneficiairesFormatted = beneficiaires.map(b => ({
      nom_complet: b.nom_complet,
      lien_souscripteur: b.lien_souscripteur,
      ordre: b.ordre
    }));
    
    return {
      id: devis.id,
      nom_produit: produit.nom,
      type_produit: produit.type,
      periodicite_prime: produit.periodicite_prime,
      criteres_utilisateur: devis.criteres_utilisateur,
      prime_calculee: primeCalculee,
      assure_est_souscripteur: devis.assure_est_souscripteur,
      informations_assure: informationsAssure,
      beneficiaires: beneficiairesFormatted,
      created_at: devis.created_at
    };
  }
}
