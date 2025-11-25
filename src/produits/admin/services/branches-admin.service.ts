import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrancheProduit } from '../../entities/branche-produit.entity';
import { Produit } from '../../entities/produit.entity';
import { CategorieProduit } from '../../entities/categorie-produit.entity';
import {
  CreateBrancheProduitDto,
  UpdateBrancheProduitDto,
  BrancheProduitAdminDto,
  BranchesResponseDto,
} from '../../dto/branche-produit-admin.dto';

@Injectable()
export class BranchesAdminService {
  constructor(
    @InjectRepository(BrancheProduit)
    private readonly brancheRepository: Repository<BrancheProduit>,
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
    @InjectRepository(CategorieProduit)
    private readonly categorieRepository: Repository<CategorieProduit>,
  ) { }

  /** Create a new branch */
  async create(createDto: CreateBrancheProduitDto): Promise<BrancheProduitAdminDto> {
    const existing = await this.brancheRepository.findOne({ where: { nom: createDto.nom } });
    if (existing) {
      throw new ConflictException(`Une branche avec le nom "${createDto.nom}" existe déjà`);
    }
    if (createDto.ordre === undefined) {
      const max = await this.brancheRepository
        .createQueryBuilder('b')
        .select('MAX(b.ordre)', 'max')
        .getRawOne();
      createDto.ordre = (max?.max || 0) + 1;
    }
    const branche = this.brancheRepository.create(createDto);
    const saved = await this.brancheRepository.save(branche);
    return this.mapToAdminDto(saved, 0, []);
  }

  /** Get all branches with pagination and categories */
  async findAll(page: number = 1, limit: number = 10): Promise<BranchesResponseDto> {
    const skip = (page - 1) * limit;
    const [branches, total] = await this.brancheRepository
      .createQueryBuilder('b')
      .leftJoin('b.produits', 'p')
      .leftJoinAndSelect('b.categories', 'c')
      .addSelect('COUNT(p.id)', 'nombre_produits')
      .groupBy('b.id')
      .addGroupBy('c.id')
      .orderBy('b.ordre', 'ASC')
      .addOrderBy('b.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const branchesWithCount = await Promise.all(
      branches.map(async (b) => {
        const count = await this.produitRepository.count({ where: { branche: { id: b.id } } });
        const cats = (b as any).categories?.map((cat: any) => ({ id: cat.id, code: cat.code, libelle: cat.libelle })) || [];
        return this.mapToAdminDto(b, count, cats);
      }),
    );

    return { branches: branchesWithCount, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  /** Get a single branch */
  async findOne(id: string): Promise<BrancheProduitAdminDto> {
    const branche = await this.brancheRepository.findOne({ where: { id }, relations: ['categories'] });
    if (!branche) {
      throw new NotFoundException('Branche non trouvée');
    }
    const count = await this.produitRepository.count({ where: { branche: { id } } });
    const cats = (branche as any).categories?.map((cat: any) => ({ id: cat.id, code: cat.code, libelle: cat.libelle })) || [];
    return this.mapToAdminDto(branche, count, cats);
  }

  /** Update a branch */
  async update(id: string, dto: UpdateBrancheProduitDto): Promise<BrancheProduitAdminDto> {
    const branche = await this.brancheRepository.findOne({ where: { id } });
    if (!branche) {
      throw new NotFoundException('Branche non trouvée');
    }
    if (dto.nom && dto.nom !== branche.nom) {
      const exists = await this.brancheRepository.findOne({ where: { nom: dto.nom } });
      if (exists) {
        throw new ConflictException(`Une branche avec le nom "${dto.nom}" existe déjà`);
      }
    }
    Object.assign(branche, dto);
    const updated = await this.brancheRepository.save(branche);
    const count = await this.produitRepository.count({ where: { branche: { id } } });
    const cats = (updated as any).categories?.map((cat: any) => ({ id: cat.id, code: cat.code, libelle: cat.libelle })) || [];
    return this.mapToAdminDto(updated, count, cats);
  }

  /** Delete a branch (only if no products) */
  async remove(id: string): Promise<{ message: string }> {
    const branche = await this.brancheRepository.findOne({ where: { id }, relations: ['produits'] });
    if (!branche) {
      throw new NotFoundException('Branche non trouvée');
    }
    if (branche.produits && branche.produits.length > 0) {
      throw new BadRequestException(`Impossible de supprimer la branche "${branche.nom}" car elle contient ${branche.produits.length} produit(s).`);
    }
    await this.brancheRepository.remove(branche);
    return { message: `Branche "${branche.nom}" supprimée avec succès` };
  }

  /** Reorder branches */
  async reorderBranches(ids: string[]): Promise<{ message: string }> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Liste d\'IDs invalide');
    }
    const existing = await this.brancheRepository.findByIds(ids);
    if (existing.length !== ids.length) {
      throw new BadRequestException('Certains IDs sont invalides');
    }
    for (let i = 0; i < ids.length; i++) {
      await this.brancheRepository.update({ id: ids[i] }, { ordre: i + 1 });
    }
    return { message: 'Ordre des branches mis à jour avec succès' };
  }

  private mapToAdminDto(
    branche: BrancheProduit,
    nombreProduits: number,
    categories: { id: string; code: string; libelle: string }[] = [],
  ): BrancheProduitAdminDto {
    return {
      id: branche.id,
      nom: branche.nom,
      type: branche.type,
      description: branche.description,
      ordre: branche.ordre,
      created_at: branche.created_at,
      nombre_produits: nombreProduits,
      categories,
    };
  }
}
