import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, ILike } from 'typeorm';
import { Produit, TypeProduit, StatutProduit } from './entities/produit.entity';
import { BrancheProduit } from './entities/branche-produit.entity';
import { ProduitDto, ProduitQueryDto, ProduitsResponseDto } from './dto/produit.dto';
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
   * Récupère tous les produits actifs avec pagination et filtres
   */
  async findAll(query: ProduitQueryDto): Promise<ProduitsResponseDto> {
    const { page = 1, limit = 10, type, branche_id, search, sort_by = 'created_at', sort_order = 'DESC' } = query;
    
    let queryBuilder = this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect('produit.branche', 'branche')
      .where('produit.statut = :statut', { statut: StatutProduit.ACTIF });

    if (type) {
      queryBuilder = queryBuilder.andWhere('produit.type = :type', { type });
    }

    if (branche_id) {
      queryBuilder = queryBuilder.andWhere('branche.id = :branche_id', { branche_id });
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(produit.nom ILIKE :search OR produit.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const validSortFields = ['nom', 'type', 'created_at', 'branche.ordre'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    
    if (sortField === 'branche.ordre') {
      queryBuilder = queryBuilder.orderBy('branche.ordre', sort_order);
    } else {
      queryBuilder = queryBuilder.orderBy(`produit.${sortField}`, sort_order);
    }

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const [produits, total] = await queryBuilder.getManyAndCount();

    const produitsDto = produits.map(produit => this.mapToDto(produit));

    return {
      produits: produitsDto,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    };
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
      branche: {
        id: produit.branche.id,
        nom: produit.branche.nom,
        description: produit.branche.description,
        ordre: produit.branche.ordre
      }
    };
  }
}
