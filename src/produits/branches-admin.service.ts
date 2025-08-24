import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrancheProduit } from './entities/branche-produit.entity';
import { Produit } from './entities/produit.entity';
import { 
  CreateBrancheProduitDto, 
  UpdateBrancheProduitDto, 
  BrancheProduitAdminDto,
  BranchesResponseDto 
} from './dto/branche-produit-admin.dto';

@Injectable()
export class BranchesAdminService {
  constructor(
    @InjectRepository(BrancheProduit)
    private readonly brancheRepository: Repository<BrancheProduit>,
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
  ) {}

  /**
   * Crée une nouvelle branche de produit
   */
  async create(createDto: CreateBrancheProduitDto): Promise<BrancheProduitAdminDto> {
    const existingBranche = await this.brancheRepository.findOne({
      where: { nom: createDto.nom }
    });

    if (existingBranche) {
      throw new ConflictException(`Une branche avec le nom "${createDto.nom}" existe déjà`);
    }

    if (createDto.ordre === undefined) {
      const maxOrdre = await this.brancheRepository
        .createQueryBuilder('branche')
        .select('MAX(branche.ordre)', 'maxOrdre')
        .getRawOne();
      
      createDto.ordre = (maxOrdre?.maxOrdre || 0) + 1;
    }

    const branche = this.brancheRepository.create(createDto);
    const savedBranche = await this.brancheRepository.save(branche);

    return this.mapToAdminDto(savedBranche, 0);
  }

  /**
   * Récupère toutes les branches avec pagination
   */
  async findAll(page: number = 1, limit: number = 10): Promise<BranchesResponseDto> {
    const skip = (page - 1) * limit;

    const [branches, total] = await this.brancheRepository
      .createQueryBuilder('branche')
      .leftJoin('branche.produits', 'produit')
      .addSelect('COUNT(produit.id)', 'nombre_produits')
      .groupBy('branche.id')
      .orderBy('branche.ordre', 'ASC')
      .addOrderBy('branche.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const branchesWithCount = await Promise.all(
      branches.map(async (branche) => {
        const count = await this.produitRepository.count({
          where: { branche: { id: branche.id } }
        });
        return this.mapToAdminDto(branche, count);
      })
    );

    return {
      branches: branchesWithCount,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit)
    };
  }

  /**
   * Récupère une branche par son ID
   */
  async findOne(id: string): Promise<BrancheProduitAdminDto> {
    const branche = await this.brancheRepository.findOne({
      where: { id }
    });

    if (!branche) {
      throw new NotFoundException(`Branche non trouvée`);
    }

    const count = await this.produitRepository.count({
      where: { branche: { id } }
    });

    return this.mapToAdminDto(branche, count);
  }

  /**
   * Met à jour une branche existante
   */
  async update(id: string, updateDto: UpdateBrancheProduitDto): Promise<BrancheProduitAdminDto> {
    const branche = await this.brancheRepository.findOne({
      where: { id }
    });

    if (!branche) {
      throw new NotFoundException(`Branche non trouvée`);
    }

    if (updateDto.nom && updateDto.nom !== branche.nom) {
      const existingBranche = await this.brancheRepository.findOne({
        where: { nom: updateDto.nom }
      });

      if (existingBranche) {
        throw new ConflictException(`Une branche avec le nom "${updateDto.nom}" existe déjà`);
      }
    }

    Object.assign(branche, updateDto);
    const updatedBranche = await this.brancheRepository.save(branche);

    const count = await this.produitRepository.count({
      where: { branche: { id } }
    });

    return this.mapToAdminDto(updatedBranche, count);
  }

  /**
   * Supprime une branche (seulement si elle n'a pas de produits)
   */
  async remove(id: string): Promise<{ message: string }> {
    const branche = await this.brancheRepository.findOne({
      where: { id },
      relations: ['produits']
    });

    if (!branche) {
      throw new NotFoundException(`Branche non trouvée`);
    }

    if (branche.produits && branche.produits.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la branche "${branche.nom}" car elle contient ${branche.produits.length} produit(s). Supprimez d'abord tous les produits de cette branche.`
      );
    }

    await this.brancheRepository.remove(branche);

    return { 
      message: `Branche "${branche.nom}" supprimée avec succès` 
    };
  }

  /**
   * Réorganise l'ordre des branches
   */
  async reorderBranches(brancheIds: string[]): Promise<{ message: string }> {
    if (!Array.isArray(brancheIds) || brancheIds.length === 0) {
      throw new BadRequestException('La liste des IDs de branches est invalide');
    }

    const existingBranches = await this.brancheRepository.findByIds(brancheIds);
    if (existingBranches.length !== brancheIds.length) {
      throw new BadRequestException('Certains IDs de branches sont invalides');
    }

    for (let i = 0; i < brancheIds.length; i++) {
      await this.brancheRepository.update(
        { id: brancheIds[i] },
        { ordre: i + 1 }
      );
    }

    return { 
      message: 'Ordre des branches mis à jour avec succès' 
    };
  }

  /**
   * Transforme une entité BrancheProduit en DTO admin
   */
  private mapToAdminDto(branche: BrancheProduit, nombreProduits: number): BrancheProduitAdminDto {
    return {
      id: branche.id,
      nom: branche.nom,
      type: branche.type,
      description: branche.description,
      ordre: branche.ordre,
      created_at: branche.created_at,
      nombre_produits: nombreProduits
    };
  }
}
