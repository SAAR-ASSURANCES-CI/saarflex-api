import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit, StatutProduit, PeriodicitePrime } from '../../entities/produit.entity';
import { BrancheProduit } from '../../entities/branche-produit.entity';
import { CategorieProduit } from '../../entities/categorie-produit.entity';
import { CritereTarification } from '../../entities/critere-tarification.entity';
import { GrilleTarifaire } from '../../entities/grille-tarifaire.entity';
import { DevisSimule } from '../../entities/devis-simule.entity';
import {
    CreateProduitDto,
    UpdateProduitDto,
    ProduitAdminDto,
    ProduitsAdminResponseDto,
} from '../../dto/produit-admin.dto';

@Injectable()
export class ProduitsAdminService {
    constructor(
        @InjectRepository(Produit)
        private readonly produitRepository: Repository<Produit>,
        @InjectRepository(BrancheProduit)
        private readonly brancheRepository: Repository<BrancheProduit>,
        @InjectRepository(CategorieProduit)
        private readonly categorieRepository: Repository<CategorieProduit>,
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
        const branche = await this.brancheRepository.findOne({ where: { id: createDto.branch_id } });
        if (!branche) {
            throw new NotFoundException(`Branche avec l'ID ${createDto.branch_id} non trouvée`);
        }
        // Vérifier l'unicité du nom
        const existingProduit = await this.produitRepository.findOne({ where: { nom: createDto.nom } });
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
            branche: branche,
            ...(createDto.categorie_id ? { categorie: { id: createDto.categorie_id } as any } : {}),
            necessite_beneficiaires: createDto.necessite_beneficiaires || false,
            max_beneficiaires: createDto.max_beneficiaires || 0,
            necessite_informations_vehicule: createDto.necessite_informations_vehicule || false,
            periodicite_prime: createDto.periodicite_prime || PeriodicitePrime.MENSUEL,
        });
        const savedProduit = await this.produitRepository.save(produit);
        const produitWithRelations = await this.produitRepository.findOne({
            where: { id: savedProduit.id },
            relations: ['branche', 'categorie', 'createur'],
        });
        if (!produitWithRelations) {
            throw new NotFoundException(`Produit créé mais non retrouvé`);
        }
        return this.mapToAdminDto(produitWithRelations, 0, 0, 0);
    }

    /**
     * Récupère tous les produits avec pagination et filtres (pour l'admin)
     */
    async findAll(
        page: number = 1,
        limit: number = 10,
        search?: string,
        branch_id?: string,
        statut?: string,
    ): Promise<ProduitsAdminResponseDto> {
        const skip = (page - 1) * limit;
        const queryBuilder = this.produitRepository
            .createQueryBuilder('produit')
            .leftJoinAndSelect('produit.branche', 'branche')
            .leftJoinAndSelect('produit.categorie', 'categorie')
            .leftJoinAndSelect('produit.createur', 'createur');
        if (search && search.trim() !== '') {
            queryBuilder.andWhere('produit.nom LIKE :search', { search: `%${search}%` });
        }
        if (branch_id && branch_id.trim() !== '') {
            queryBuilder.andWhere('produit.branch_id = :branch_id', { branch_id });
        }
        if (statut && statut.trim() !== '') {
            queryBuilder.andWhere('produit.statut = :statut', { statut });
        }
        const [produits, total] = await queryBuilder
            .orderBy('produit.created_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        const produitsDto = await Promise.all(
            produits.map(async (produit) => {
                const [criteresCount, grillesCount, devisCount] = await Promise.all([
                    this.critereRepository.count({ where: { produit: { id: produit.id } } }),
                    this.grilleRepository.count({ where: { produit: { id: produit.id } } }),
                    this.devisRepository.count({ where: { produit: { id: produit.id } } }),
                ]);
                return this.mapToAdminDto(produit, criteresCount, grillesCount, devisCount);
            }),
        );
        return {
            produits: produitsDto,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    /**
     * Récupère un produit par son ID (pour l'admin)
     */
    async findOne(id: string): Promise<ProduitAdminDto> {
        const produit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche', 'categorie', 'createur'],
        });
        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }
        if (!produit.branche) {
            throw new NotFoundException(`La branche associée au produit ${id} n'existe pas`);
        }
        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } }),
        ]);
        return this.mapToAdminDto(produit, criteresCount, grillesCount, devisCount);
    }

    /**
     * Met à jour un produit existant
     */
    async update(id: string, updateDto: UpdateProduitDto): Promise<ProduitAdminDto> {
        const produit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche', 'categorie'],
        });
        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }
        // Gestion du changement de branche
        if (updateDto.branch_id && updateDto.branch_id !== produit.branche?.id) {
            const branche = await this.brancheRepository.findOne({ where: { id: updateDto.branch_id } });
            if (!branche) {
                throw new NotFoundException(`Branche non trouvée`);
            }
            produit.branche = branche;
        }
        // Gestion du changement de catégorie
        if (updateDto.categorie_id) {
            const categorie = await this.categorieRepository.findOne({ where: { id: updateDto.categorie_id } });
            if (!categorie) {
                throw new NotFoundException(`Categorie avec l'ID ${updateDto.categorie_id} non trouvée`);
            }
            produit.categorie = categorie;
        }
        // Vérification du nom unique
        if (updateDto.nom && updateDto.nom !== produit.nom) {
            const existingProduit = await this.produitRepository.findOne({ where: { nom: updateDto.nom } });
            if (existingProduit) {
                throw new ConflictException(`Un produit avec le nom "${updateDto.nom}" existe déjà`);
            }
        }
        // Mise à jour des champs simples
        if (updateDto.nom) produit.nom = updateDto.nom;
        if (updateDto.icon !== undefined) produit.icon = updateDto.icon;
        if (updateDto.type) produit.type = updateDto.type;
        if (updateDto.description !== undefined) produit.description = updateDto.description;
        if (updateDto.conditions_pdf !== undefined) produit.conditions_pdf = updateDto.conditions_pdf;
        if (updateDto.statut) produit.statut = updateDto.statut;
        if (updateDto.necessite_beneficiaires !== undefined) produit.necessite_beneficiaires = updateDto.necessite_beneficiaires;
        if (updateDto.max_beneficiaires !== undefined) produit.max_beneficiaires = updateDto.max_beneficiaires;
        if (updateDto.necessite_informations_vehicule !== undefined) produit.necessite_informations_vehicule = updateDto.necessite_informations_vehicule;
        if (updateDto.periodicite_prime !== undefined) produit.periodicite_prime = updateDto.periodicite_prime;
        const updatedProduit = await this.produitRepository.save(produit);
        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } }),
        ]);
        const refreshedProduit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche', 'categorie', 'createur'],
        });
        if (!refreshedProduit) {
            throw new NotFoundException(`Produit mis à jour mais non retrouvé`);
        }
        return this.mapToAdminDto(refreshedProduit, criteresCount, grillesCount, devisCount);
    }

    /**
     * Supprime un produit (seulement s'il n'a pas d'éléments associés)
     */
    async remove(id: string): Promise<{ message: string }> {
        const produit = await this.produitRepository.findOne({ where: { id } });
        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
        }
        const [criteresCount, grillesCount, devisCount] = await Promise.all([
            this.critereRepository.count({ where: { produit: { id } } }),
            this.grilleRepository.count({ where: { produit: { id } } }),
            this.devisRepository.count({ where: { produit: { id } } }),
        ]);
        if (criteresCount > 0 || grillesCount > 0 || devisCount > 0) {
            throw new BadRequestException(
                `Impossible de supprimer le produit "${produit.nom}" car il a des éléments associés : ` +
                `${criteresCount} critère(s), ${grillesCount} grille(s), ${devisCount} devis`,
            );
        }
        await this.produitRepository.remove(produit);
        return { message: `Produit "${produit.nom}" supprimé avec succès` };
    }

    /**
     * Change le statut d'un produit
     */
    async changeStatus(id: string, newStatus: string): Promise<ProduitAdminDto> {
        const produit = await this.produitRepository.findOne({
            where: { id },
            relations: ['branche', 'categorie', 'createur'],
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
            this.devisRepository.count({ where: { produit: { id } } }),
        ]);
        return this.mapToAdminDto(updatedProduit, criteresCount, grillesCount, devisCount);
    }

    /**
     * Transforme une entité Produit en DTO admin
     */
    private mapToAdminDto(
        produit: Produit,
        nombreCriteres: number,
        nombreGrilles: number,
        nombreDevis: number,
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
            createur: produit.createur
                ? { id: produit.createur.id, nom: produit.createur.nom, email: produit.createur.email }
                : null,
            necessite_beneficiaires: produit.necessite_beneficiaires,
            max_beneficiaires: produit.max_beneficiaires,
            necessite_informations_vehicule: produit.necessite_informations_vehicule,
            periodicite_prime: produit.periodicite_prime,
            branche: produit.branche
                ? { id: produit.branche.id, nom: produit.branche.nom, type: produit.branche.type, description: produit.branche.description }
                : null,
            categorie: produit.categorie
                ? { id: produit.categorie.id, code: produit.categorie.code, libelle: produit.categorie.libelle }
                : null,
            nombre_criteres: nombreCriteres,
            nombre_grilles: nombreGrilles,
            nombre_devis: nombreDevis,
        };
    }
}
