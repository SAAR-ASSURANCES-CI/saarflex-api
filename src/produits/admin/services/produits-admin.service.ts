import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit, StatutProduit } from '../../entities/produit.entity';
import { BrancheProduit } from '../../entities/branche-produit.entity';
import { CritereTarification } from '../../entities/critere-tarification.entity';
import { GrilleTarifaire } from '../../entities/grille-tarifaire.entity';
import { DevisSimule } from '../../entities/devis-simule.entity';
import { 
    CreateProduitDto, 
    UpdateProduitDto, 
    ProduitAdminDto,
    ProduitsAdminResponseDto
} from '../../dto/produit-admin.dto';

@Injectable()
export class ProduitsAdminService {
    constructor(
        @InjectRepository(Produit)
        private readonly produitRepository: Repository<Produit>,
        @InjectRepository(BrancheProduit)
        private readonly brancheRepository: Repository<BrancheProduit>,
        @InjectRepository(CritereTarification)
        private readonly critereRepository: Repository<CritereTarification>,
        @InjectRepository(GrilleTarifaire)
        private readonly grilleRepository: Repository<GrilleTarifaire>,
        @InjectRepository(DevisSimule)
        private readonly devisRepository: Repository<DevisSimule>,
    ) { }

    /**
     * Crée un nouveau produit d'assurance
     */
    async create(createDto: CreateProduitDto, userId: string): Promise<ProduitAdminDto> {
        const branche = await this.brancheRepository.findOne({
            where: { id: createDto.branch_id }
        });

        if (!branche) {
            throw new NotFoundException(`Branche avec l'ID ${createDto.branch_id} non trouvée`);
        }

        const existingProduit = await this.produitRepository.findOne({
            where: { nom: createDto.nom }
        });

        if (existingProduit) {
            throw new ConflictException(`Un produit avec le nom "${createDto.nom}" existe déjà`);
        }

        const produit = this.produitRepository.create({
            nom: createDto.nom,
            icon: createDto.icon,
            type: createDto.type,
            description: createDto.description,
            conditions_pdf: createDto.conditions_pdf,
            statut: createDto.statut || StatutProduit.BROUILLON,
            created_by: userId,
            branche: branche 
        });

        const savedProduit = await this.produitRepository.save(produit);

        return this.mapToAdminDto(savedProduit, branche, 0, 0, 0);
    }

    /**
     * Récupère tous les produits avec pagination et filtres (pour l'admin)
     */
    async findAll(page: number = 1, limit: number = 10): Promise<ProduitsAdminResponseDto> {
        const skip = (page - 1) * limit;

        const [produits, total] = await this.produitRepository
            .createQueryBuilder('produit')
            .leftJoinAndSelect('produit.branche', 'branche')
            .orderBy('produit.created_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const produitsDto = await Promise.all(
            produits.map(async (produit) => {
                const [criteresCount, grillesCount, devisCount] = await Promise.all([
                    this.critereRepository.count({ where: { produit: { id: produit.id } } }),
                    this.grilleRepository.count({ where: { produit: { id: produit.id } } }),
                    this.devisRepository.count({ where: { produit: { id: produit.id } } })
                ]);

                return this.mapToAdminDto(
                    produit,
                    produit.branche,
                    criteresCount,
                    grillesCount,
                    devisCount
                );
            })
        );

        return {
            produits: produitsDto,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit)
        };
    }

    /**
     * Récupère un produit par son ID (pour l'admin)
     */
    async findOne(id: string): Promise<ProduitAdminDto> {
        const produit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche']
        });

        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }

        // Vérifier si la branche existe
        if (!produit.branche) {
            throw new NotFoundException(`La branche associée au produit ${id} n'existe pas`);
        }

        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } })
        ]);

        return this.mapToAdminDto(
            produit,
            produit.branche,
            criteresCount,
            grillesCount,
            devisCount
        );
    }

    /**
     * Met à jour un produit existant
     */
    async update(id: string, updateDto: UpdateProduitDto): Promise<ProduitAdminDto> {
        const produit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche']
        });

        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }

        if (updateDto.branch_id && updateDto.branch_id !== produit.branche.id) {
            const branche = await this.brancheRepository.findOne({
                where: { id: updateDto.branch_id }
            });

            if (!branche) {
                throw new NotFoundException(`Branche avec l'ID ${updateDto.branch_id} non trouvée`);
            }
        }

        if (updateDto.nom && updateDto.nom !== produit.nom) {
            const existingProduit = await this.produitRepository.findOne({
                where: { nom: updateDto.nom }
            });

            if (existingProduit) {
                throw new ConflictException(`Un produit avec le nom "${updateDto.nom}" existe déjà`);
            }
        }

        if (updateDto.nom) produit.nom = updateDto.nom;
        if (updateDto.icon !== undefined) produit.icon = updateDto.icon;
        if (updateDto.type) produit.type = updateDto.type;
        if (updateDto.description !== undefined) produit.description = updateDto.description;
        if (updateDto.conditions_pdf !== undefined) produit.conditions_pdf = updateDto.conditions_pdf;
        if (updateDto.statut) produit.statut = updateDto.statut;
        
        if (updateDto.branch_id && updateDto.branch_id !== produit.branche.id) {
            const brancheTrouvee = await this.brancheRepository.findOne({
                where: { id: updateDto.branch_id }
            });
            if (!brancheTrouvee) {
                throw new NotFoundException(`Branche avec l'ID ${updateDto.branch_id} non trouvée`);
            }
            produit.branche = brancheTrouvee;
        }
        
        const updatedProduit = await this.produitRepository.save(produit);

        const branche = produit.branche;

        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } })
        ]);

        return this.mapToAdminDto(
            updatedProduit,
            branche,
            criteresCount,
            grillesCount,
            devisCount
        );
    }

    /**
     * Supprime un produit (seulement s'il n'a pas d'éléments associés)
     */
    async remove(id: string): Promise<{ message: string }> {
        const produit = await this.produitRepository.findOne({
            where: { id }
        });

        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }

        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } })
        ]);

        if (criteresCount > 0 || grillesCount > 0 || devisCount > 0) {
            throw new BadRequestException(
                `Impossible de supprimer le produit "${produit.nom}" car il a des éléments associés : ` +
                `${criteresCount} critère(s), ${grillesCount} grille(s), ${devisCount} devis`
            );
        }

        await this.produitRepository.remove(produit);

        return {
            message: `Produit "${produit.nom}" supprimé avec succès`
        };
    }

    /**
     * Change le statut d'un produit
     */
    async changeStatus(id: string, newStatus: string): Promise<ProduitAdminDto> {
        const produit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche']
        });

        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }

        if (!Object.values(StatutProduit).includes(newStatus as StatutProduit)) {
            throw new BadRequestException(`Statut invalide: ${newStatus}`);
        }

        produit.statut = newStatus as StatutProduit;
        const updatedProduit = await this.produitRepository.save(produit);

        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } })
        ]);

        return this.mapToAdminDto(
            updatedProduit,
            produit.branche,
            criteresCount,
            grillesCount,
            devisCount
        );
    }

    /**
     * Transforme une entité Produit en DTO admin
     */
    private mapToAdminDto(
        produit: Produit,
        branche: BrancheProduit,
        nombreCriteres: number,
        nombreGrilles: number,
        nombreDevis: number
    ): ProduitAdminDto {
        return {
            id: produit.id,
            nom: produit.nom,
            icon: produit.icon,
            type: produit.type,
            description: produit.description,
            conditions_pdf: produit.conditions_pdf,
            statut: produit.statut,
            created_at: produit.created_at,
            updated_at: produit.updated_at,
            created_by: produit.created_by,
            necessite_beneficiaires: produit.necessite_beneficiaires,
            max_beneficiaires: produit.max_beneficiaires,
            periodicite_prime: produit.periodicite_prime,
            branche: branche ? {
                id: branche.id,
                nom: branche.nom,
                type: branche.type,
                description: branche.description
            } : null,
            nombre_criteres: nombreCriteres,
            nombre_grilles: nombreGrilles,
            nombre_devis: nombreDevis
        };
    }
}
