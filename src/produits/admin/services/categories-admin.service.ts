import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategorieProduit } from '../../entities/categorie-produit.entity';
import { BrancheProduit } from '../../entities/branche-produit.entity';
import { CreateCategorieDto } from '../dto/create-categorie.dto';
import { UpdateCategorieDto } from '../dto/update-categorie.dto';

@Injectable()
export class CategoriesAdminService {
    constructor(
        @InjectRepository(CategorieProduit)
        private readonly categorieRepository: Repository<CategorieProduit>,
        @InjectRepository(BrancheProduit)
        private readonly brancheRepository: Repository<BrancheProduit>,
    ) { }

    async create(createCategorieDto: CreateCategorieDto): Promise<CategorieProduit> {
        const { branche_id, code, ...rest } = createCategorieDto;

        const branche = await this.brancheRepository.findOne({ where: { id: branche_id } });
        if (!branche) {
            throw new NotFoundException(`Branche with ID ${branche_id} not found`);
        }

        // Check for duplicate code in the same branch
        const existing = await this.categorieRepository.findOne({
            where: { code, branche: { id: branche_id } },
        });
        if (existing) {
            throw new ConflictException(`Category with code ${code} already exists in this branch`);
        }

        const categorie = this.categorieRepository.create({
            ...rest,
            code,
            branche,
        });

        return this.categorieRepository.save(categorie);
    }

    async findAll(): Promise<CategorieProduit[]> {
        return this.categorieRepository.find({
            relations: ['branche'],
            order: { code: 'ASC' },
        });
    }

    async findOne(id: string): Promise<CategorieProduit> {
        const categorie = await this.categorieRepository.findOne({
            where: { id },
            relations: ['branche'],
        });

        if (!categorie) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return categorie;
    }

    async update(id: string, updateCategorieDto: UpdateCategorieDto): Promise<CategorieProduit> {
        const categorie = await this.findOne(id);
        const { branche_id, code, ...rest } = updateCategorieDto;

        if (branche_id) {
            const branche = await this.brancheRepository.findOne({ where: { id: branche_id } });
            if (!branche) {
                throw new NotFoundException(`Branche with ID ${branche_id} not found`);
            }
            categorie.branche = branche;
        }

        if (code && (code !== categorie.code || (branche_id && branche_id !== categorie.branche.id))) {
            // Check for duplicate code if code or branch is changing
            const targetBrancheId = branche_id || categorie.branche.id;
            const existing = await this.categorieRepository.findOne({
                where: { code, branche: { id: targetBrancheId } },
            });
            if (existing && existing.id !== id) {
                throw new ConflictException(`Category with code ${code} already exists in the target branch`);
            }
            categorie.code = code;
        }

        Object.assign(categorie, rest);

        return this.categorieRepository.save(categorie);
    }

    async remove(id: string): Promise<void> {
        const result = await this.categorieRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
    }

    async findByBranche(brancheId: string): Promise<CategorieProduit[]> {
        return this.categorieRepository.find({
            where: { branche: { id: brancheId } },
            order: { code: 'ASC' },
        });
    }
}
