import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, ILike } from 'typeorm';
import { Produit, TypeProduit, StatutProduit } from './entities/produit.entity';
import { BrancheProduit } from './entities/branche-produit.entity';
import { ProduitDto } from './dto/produit.dto';
import { BrancheProduitDto } from './dto/branche-produit.dto';

@Injectable()
export class ProduitsService {
  constructor(
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
    @InjectRepository(BrancheProduit)
    private readonly brancheRepository: Repository<BrancheProduit>,
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
      branche: produit.branche ? {
        id: produit.branche.id,
        nom: produit.branche.nom,
        description: produit.branche.description,
        ordre: produit.branche.ordre
      } : null
    };
  }
}
