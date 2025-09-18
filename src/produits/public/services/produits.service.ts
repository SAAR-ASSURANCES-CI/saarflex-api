import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, ILike } from 'typeorm';
import { Produit, TypeProduit, StatutProduit } from '../../entities/produit.entity';
import { BrancheProduit } from '../../entities/branche-produit.entity';
import { Garantie, StatutGarantie } from '../../entities/garantie.entity';
import { CritereTarification } from '../../entities/critere-tarification.entity';
import { ValeurCritere } from '../../entities/valeur-critere.entity';
import { ProduitDto } from '../../dto/produit.dto';
import { BrancheProduitDto } from '../../dto/branche-produit.dto';
import { GarantieWithProduitDto } from '../../dto/garanties-index.dto';
import { 
  CritereTarificationPublicDto, 
  ValeurCriterePublicDto, 
  CriteresPublicResponseDto 
} from '../../dto/critere-tarification-public.dto';

@Injectable()
export class ProduitsService {
  constructor(
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
    @InjectRepository(BrancheProduit)
    private readonly brancheRepository: Repository<BrancheProduit>,
    @InjectRepository(Garantie)
    private readonly garantieRepository: Repository<Garantie>,
    @InjectRepository(CritereTarification)
    private readonly critereRepository: Repository<CritereTarification>,
    @InjectRepository(ValeurCritere)
    private readonly valeurRepository: Repository<ValeurCritere>,
  ) {}

  /**
   * Récupère tous les produits actifs pour les utilisateurs
   */
  async findAll(): Promise<ProduitDto[]> {
    const produits = await this.produitRepository.find({
      where: { statut: StatutProduit.ACTIF },
      relations: ['branche'],
      order: { created_at: 'DESC' }
    });

    return produits.map(produit => this.mapToDto(produit));
  }



  /**
   * Récupère un produit par son ID
   */
  async findOne(id: string): Promise<ProduitDto> {
    const produit = await this.produitRepository.findOne({
      where: { id, statut: StatutProduit.ACTIF },
      relations: ['branche']
    });

    if (!produit) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    return this.mapToDto(produit);
  }

  /**
   * Récupère tous les produits d'un type spécifique
   */
  async findByType(type: TypeProduit): Promise<ProduitDto[]> {
    const produits = await this.produitRepository.find({
      where: { type, statut: StatutProduit.ACTIF },
      relations: ['branche'],
      order: { created_at: 'DESC' }
    });

    return produits.map(produit => this.mapToDto(produit));
  }

  /**
   * Récupère tous les produits d'une branche spécifique
   */
  async findByBranche(brancheId: string): Promise<ProduitDto[]> {
    const produits = await this.produitRepository.find({
      where: { branche: { id: brancheId }, statut: StatutProduit.ACTIF },
      relations: ['branche'],
      order: { created_at: 'DESC' }
    });

    return produits.map(produit => this.mapToDto(produit));
  }

  /**
   * Récupère toutes les branches avec leurs produits
   */
  async findAllBranches(): Promise<BrancheProduitDto[]> {
    const branches = await this.brancheRepository.find({
      relations: ['produits'],
      order: { ordre: 'ASC' }
    });

    return branches.map(branche => ({
      id: branche.id,
      nom: branche.nom,
      description: branche.description,
      ordre: branche.ordre
    }));
  }

  /**
   * Récupère toutes les garanties actives d'un produit avec les données du produit
   */
  async findGarantiesByProduit(produitId: string): Promise<GarantieWithProduitDto[]> {
    const garanties = await this.garantieRepository.find({
      where: { 
        produit_id: produitId, 
        statut: StatutGarantie.ACTIVE 
      },
      relations: ['produit', 'produit.branche'],
      order: { ordre: 'ASC', created_at: 'DESC' }
    });

    return garanties.map(garantie => this.mapGarantieToDtoWithProduit(garantie));
  }

  /**
   * Récupère toutes les garanties actives avec les données du produit associé
   */
  async findAllGarantiesWithProduit(): Promise<GarantieWithProduitDto[]> {
    const garanties = await this.garantieRepository.find({
      where: { statut: StatutGarantie.ACTIVE },
      relations: ['produit', 'produit.branche'],
      order: { ordre: 'ASC', created_at: 'DESC' }
    });

    return garanties.map(garantie => this.mapGarantieToDtoWithProduit(garantie));
  }

  /**
   * Récupère une garantie active par ID avec les données du produit
   */
  async findGarantieWithProduit(id: string): Promise<GarantieWithProduitDto> {
    const garantie = await this.garantieRepository.findOne({
      where: { id, statut: StatutGarantie.ACTIVE },
      relations: ['produit', 'produit.branche']
    });

    if (!garantie) {
      throw new NotFoundException(`Garantie non trouvée`);
    }

    return this.mapGarantieToDtoWithProduit(garantie);
  }

  /**
   * Récupère tous les critères d'un produit avec pagination
   */
  async findCriteresByProduit(
    produitId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<CriteresPublicResponseDto> {
    const skip = (page - 1) * limit;

    const produit = await this.produitRepository.findOne({
      where: { id: produitId, statut: StatutProduit.ACTIF }
    });

    if (!produit) {
      throw new NotFoundException(`Produit avec l'ID ${produitId} non trouvé ou inactif`);
    }

    const [criteres, total] = await this.critereRepository
      .createQueryBuilder('critere')
      .where('critere.produit_id = :produitId', { produitId })
      .orderBy('critere.ordre', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const criteresDto = await Promise.all(
      criteres.map(async (critere) => {
        const valeurs = await this.valeurRepository.find({
          where: { critere_id: critere.id },
          order: { ordre: 'ASC' }
        });
        return this.mapCritereToPublicDto(critere, valeurs);
      })
    );

    return {
      criteres: criteresDto,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    };
  }

  /**
   * Transforme une entité Produit en DTO
   */
  private mapToDto(produit: Produit): ProduitDto {
    return {
      id: produit.id,
      nom: produit.nom,
      icon: produit.icon,
      type: produit.type,
      description: produit.description,
      conditions_pdf: produit.conditions_pdf,
      statut: produit.statut,
      created_at: produit.created_at,
      // Nouvelles propriétés pour le système simplifié
      necessite_beneficiaires: produit.necessite_beneficiaires,
      max_beneficiaires: produit.max_beneficiaires,
      periodicite_prime: produit.periodicite_prime,
      branche: produit.branche ? {
        id: produit.branche.id,
        nom: produit.branche.nom,
        description: produit.branche.description,
        ordre: produit.branche.ordre
      } : null
    };
  }

  /**
   * Transforme une entité Garantie en DTO avec données du produit
   */
  private mapGarantieToDtoWithProduit(garantie: Garantie): GarantieWithProduitDto {
    return {
      id: garantie.id,
      nom: garantie.nom,
      description: garantie.description,
      type: garantie.type,
      montant_garanti: garantie.montant_garanti,
      franchise: garantie.franchise,
      ordre: garantie.ordre,
      produit_id: garantie.produit_id,
      statut: garantie.statut,
      created_by: garantie.created_by,
      created_at: garantie.created_at,
      updated_at: garantie.updated_at,
      produit: {
        id: garantie.produit.id,
        nom: garantie.produit.nom,
        icon: garantie.produit.icon,
        type: garantie.produit.type,
        description: garantie.produit.description,
        statut: garantie.produit.statut,
        // Nouvelles propriétés pour le système simplifié
        necessite_beneficiaires: garantie.produit.necessite_beneficiaires,
        max_beneficiaires: garantie.produit.max_beneficiaires,
        periodicite_prime: garantie.produit.periodicite_prime,
        branche: garantie.produit.branche ? {
          id: garantie.produit.branche.id,
          nom: garantie.produit.branche.nom,
          type: garantie.produit.branche.type,
          description: garantie.produit.branche.description
        } : undefined
      }
    };
  }

  /**
   * Transforme une entité CritereTarification en DTO public
   */
  private mapCritereToPublicDto(critere: CritereTarification, valeurs: ValeurCritere[]): CritereTarificationPublicDto {
    const valeursDto: ValeurCriterePublicDto[] = valeurs.map(valeur => ({
      id: valeur.id,
      valeur: valeur.valeur,
      valeur_min: valeur.valeur_min,
      valeur_max: valeur.valeur_max,
      ordre: valeur.ordre
    }));

    return {
      id: critere.id,
      nom: critere.nom,
      type: critere.type,
      unite: critere.unite,
      ordre: critere.ordre,
      obligatoire: critere.obligatoire,
      valeurs: valeursDto,
      nombre_valeurs: valeurs.length
    };
  }
}
