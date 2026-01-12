import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CritereTarification, TypeCritere } from '../../entities/critere-tarification.entity';
import { ValeurCritere } from '../../entities/valeur-critere.entity';
import { Produit } from '../../entities/produit.entity';
import { Tarif } from '../../entities/tarif.entity';
import {
    CreateCritereTarificationDto,
    UpdateCritereTarificationDto,
    CreateValeurCritereDto,
    UpdateValeurCritereDto,
    CritereTarificationAdminDto,
    ValeurCritereDto,
    CriteresAdminResponseDto
} from '../../dto/critere-tarification-admin.dto';

@Injectable()
export class CriteresAdminService {
    constructor(
        @InjectRepository(CritereTarification)
        private readonly critereRepository: Repository<CritereTarification>,
        @InjectRepository(ValeurCritere)
        private readonly valeurRepository: Repository<ValeurCritere>,
        @InjectRepository(Produit)
        private readonly produitRepository: Repository<Produit>,
        @InjectRepository(Tarif)
        private readonly tarifRepository: Repository<Tarif>,
    ) { }

    /**
     * Crée un nouveau critère de tarification
     */
    async create(createDto: CreateCritereTarificationDto): Promise<CritereTarificationAdminDto> {

        const produit = await this.produitRepository.findOne({
            where: { id: createDto.produit_id }
        });

        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${createDto.produit_id} non trouvé`);
        }

        const existingCritere = await this.critereRepository.findOne({
            where: {
                nom: createDto.nom,
                produit_id: createDto.produit_id
            }
        });

        if (existingCritere) {
            throw new ConflictException(`Un critère avec le nom "${createDto.nom}" existe déjà pour ce produit`);
        }

        const critere = this.critereRepository.create({
            produit_id: createDto.produit_id,
            nom: createDto.nom,
            type: createDto.type,
            unite: createDto.unite,
            ordre: createDto.ordre,
            obligatoire: createDto.obligatoire
        });

        const savedCritere = await this.critereRepository.save(critere);

        let valeurs: ValeurCritere[] = [];
        if (createDto.valeurs && createDto.valeurs.length > 0) {
            valeurs = await this.createValeurs(savedCritere.id, createDto.valeurs);
        }

        const produitInfo = await this.produitRepository.findOne({
            where: { id: createDto.produit_id }
        });

        return this.mapToAdminDto(savedCritere, valeurs, produitInfo);
    }

    /**
     * Récupère tous les critères d'un produit avec pagination
     */
    async findAllByProduit(
        produitId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<CriteresAdminResponseDto> {
        const skip = (page - 1) * limit;

        const produit = await this.produitRepository.findOne({
            where: { id: produitId }
        });

        if (!produit) {
            throw new NotFoundException(`Produit avec l'ID ${produitId} non trouvé`);
        }

        const [criteres, total] = await this.critereRepository
            .createQueryBuilder('critere')
            .leftJoinAndSelect('critere.valeurs', 'valeurs')
            .where('critere.produit_id = :produitId', { produitId })
            .orderBy('critere.ordre', 'ASC')
            .addOrderBy('valeurs.ordre', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const criteresDto = await Promise.all(
            criteres.map(async (critere) => {
                const valeurs = await this.valeurRepository.find({
                    where: { critere_id: critere.id },
                    order: { ordre: 'ASC' }
                });
                return this.mapToAdminDto(critere, valeurs, produit);
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
     * Récupère un critère par son ID
     */
    async findOne(id: string): Promise<CritereTarificationAdminDto> {
        const critere = await this.critereRepository.findOne({
            where: { id },
            relations: ['valeurs']
        });

        if (!critere) {
            throw new NotFoundException(`Critère avec l'ID ${id} non trouvé`);
        }

        const produit = await this.produitRepository.findOne({
            where: { id: critere.produit_id }
        });

        const valeurs = await this.valeurRepository.find({
            where: { critere_id: id },
            order: { ordre: 'ASC' }
        });

        return this.mapToAdminDto(critere, valeurs, produit);
    }

    /**
     * Met à jour un critère existant
     */
    async update(id: string, updateDto: UpdateCritereTarificationDto): Promise<CritereTarificationAdminDto> {
        const critere = await this.critereRepository.findOne({
            where: { id }
        });

        if (!critere) {
            throw new NotFoundException(`Critère non trouvé`);
        }

        if (updateDto.nom && updateDto.nom !== critere.nom) {
            const existingCritere = await this.critereRepository.findOne({
                where: {
                    nom: updateDto.nom,
                    produit_id: critere.produit_id,
                    id: Not(id)
                }
            });

            if (existingCritere) {
                throw new ConflictException(`Un critère avec le nom "${updateDto.nom}" existe déjà pour ce produit`);
            }
        }

        if (updateDto.nom !== undefined) critere.nom = updateDto.nom;

        if (updateDto.type !== undefined && updateDto.type !== critere.type) {
            const tarifsCount = await this.tarifRepository.count({
                where: { critere_id: id }
            });

            if (tarifsCount > 0) {
                throw new BadRequestException(
                    `Impossible de changer le type du critère car ${tarifsCount} tarifs y sont déjà associés. ` +
                    `Supprimez d'abord les tarifs pour modifier le type.`
                );
            }

            if ([TypeCritere.TEXTE, TypeCritere.DATE, TypeCritere.BOOLEEN].includes(updateDto.type)) {
                await this.valeurRepository.delete({ critere_id: id });
            }

            critere.type = updateDto.type;
        }

        if (updateDto.unite !== undefined) critere.unite = updateDto.unite;
        if (updateDto.ordre !== undefined) critere.ordre = updateDto.ordre;
        if (updateDto.obligatoire !== undefined) critere.obligatoire = updateDto.obligatoire;

        const updatedCritere = await this.critereRepository.save(critere);

        const produitInfo = await this.produitRepository.findOne({
            where: { id: critere.produit_id }
        });

        const valeurs = await this.valeurRepository.find({
            where: { critere_id: id },
            order: { ordre: 'ASC' }
        });

        return this.mapToAdminDto(updatedCritere, valeurs, produitInfo);
    }

    /**
     * Supprime un critère et ses valeurs associées
     */
    async remove(id: string): Promise<{ message: string }> {
        const critere = await this.critereRepository.findOne({
            where: { id }
        });

        if (!critere) {
            throw new NotFoundException(`Critère non trouvé`);
        }

        await this.valeurRepository.delete({ critere_id: id });

        await this.critereRepository.remove(critere);

        return {
            message: `Critère "${critere.nom}" supprimé avec succès`
        };
    }

    /**
     * Ajoute une valeur à un critère existant
     */
    async addValeur(critereId: string, createValeurDto: CreateValeurCritereDto): Promise<ValeurCritereDto> {
        const critere = await this.critereRepository.findOne({
            where: { id: critereId }
        });

        if (!critere) {
            throw new NotFoundException(`Critère avec l'ID ${critereId} non trouvé`);
        }

        this.validateValeurForType(critere.type, createValeurDto);

        const valeur = this.valeurRepository.create({
            critere_id: critereId,
            valeur: createValeurDto.valeur,
            valeur_min: createValeurDto.valeur_min,
            valeur_max: createValeurDto.valeur_max,
            ordre: createValeurDto.ordre
        });

        const savedValeur = await this.valeurRepository.save(valeur);

        return this.mapValeurToDto(savedValeur);
    }

    /**
     * Met à jour une valeur de critère
     */
    async updateValeur(valeurId: string, updateValeurDto: UpdateValeurCritereDto): Promise<ValeurCritereDto> {
        const valeur = await this.valeurRepository.findOne({
            where: { id: valeurId },
            relations: ['critere']
        });

        if (!valeur) {
            throw new NotFoundException(`Valeur avec l'ID ${valeurId} non trouvée`);
        }

        if (updateValeurDto.valeur !== undefined || updateValeurDto.valeur_min !== undefined || updateValeurDto.valeur_max !== undefined) {
            this.validateValeurForType(valeur.critere.type, {
                valeur: updateValeurDto.valeur ?? valeur.valeur,
                valeur_min: updateValeurDto.valeur_min ?? valeur.valeur_min,
                valeur_max: updateValeurDto.valeur_max ?? valeur.valeur_max,
                ordre: valeur.ordre
            });
        }

        if (updateValeurDto.valeur !== undefined) valeur.valeur = updateValeurDto.valeur;
        if (updateValeurDto.valeur_min !== undefined) valeur.valeur_min = updateValeurDto.valeur_min;
        if (updateValeurDto.valeur_max !== undefined) valeur.valeur_max = updateValeurDto.valeur_max;
        if (updateValeurDto.ordre !== undefined) valeur.ordre = updateValeurDto.ordre;

        const updatedValeur = await this.valeurRepository.save(valeur);

        return this.mapValeurToDto(updatedValeur);
    }

    /**
     * Supprime une valeur de critère
     */
    async removeValeur(valeurId: string): Promise<{ message: string }> {
        const valeur = await this.valeurRepository.findOne({
            where: { id: valeurId }
        });

        if (!valeur) {
            throw new NotFoundException(`Valeur avec l'ID ${valeurId} non trouvée`);
        }

        await this.valeurRepository.remove(valeur);

        return {
            message: 'Valeur supprimée avec succès'
        };
    }

    /**
     * Crée plusieurs valeurs pour un critère
     */
    private async createValeurs(critereId: string, valeursDto: CreateValeurCritereDto[]): Promise<ValeurCritere[]> {
        const valeurs: ValeurCritere[] = [];

        for (const valeurDto of valeursDto) {
            const valeur = this.valeurRepository.create({
                critere_id: critereId,
                valeur: valeurDto.valeur,
                valeur_min: valeurDto.valeur_min,
                valeur_max: valeurDto.valeur_max,
                ordre: valeurDto.ordre
            });

            const savedValeur = await this.valeurRepository.save(valeur);
            valeurs.push(savedValeur);
        }

        return valeurs;
    }

    /**
     * Valide qu'une valeur est compatible avec le type de critère
     */
    private validateValeurForType(type: TypeCritere, valeurDto: CreateValeurCritereDto): void {
        switch (type) {
            case TypeCritere.NUMERIQUE:
                if (valeurDto.valeur_min === undefined || valeurDto.valeur_max === undefined) {
                    throw new BadRequestException('Les critères numériques doivent avoir des valeurs min et max');
                }
                if (valeurDto.valeur_min >= valeurDto.valeur_max) {
                    throw new BadRequestException('La valeur minimale doit être inférieure à la valeur maximale');
                }
                break;

            case TypeCritere.CATEGORIEL:
                if (!valeurDto.valeur) {
                    throw new BadRequestException('Les critères catégoriels doivent avoir une valeur textuelle');
                }
                break;

            case TypeCritere.BOOLEEN:
                if (!valeurDto.valeur || !['Oui', 'Non', 'True', 'False', '1', '0'].includes(valeurDto.valeur)) {
                    throw new BadRequestException('Les critères booléens doivent avoir une valeur Oui/Non, True/False ou 1/0');
                }
                break;
        }
    }

    /**
     * Transforme une entité CritereTarification en DTO
     */
    private mapToAdminDto(critere: CritereTarification, valeurs: ValeurCritere[], produit?: any): CritereTarificationAdminDto {
        return {
            id: critere.id,
            produit_id: critere.produit_id,
            nom: critere.nom,
            type: critere.type,
            unite: critere.unite,
            ordre: critere.ordre,
            obligatoire: critere.obligatoire,
            created_at: critere.created_at,
            valeurs: valeurs.map(v => this.mapValeurToDto(v)),
            nombre_valeurs: valeurs.length,
            produit: produit ? {
                id: produit.id,
                nom: produit.nom,
                icon: produit.icon,
                type: produit.type,
                description: produit.description,
                conditions_pdf: produit.conditions_pdf,
                statut: produit.statut,
                created_at: produit.created_at
            } : undefined
        };
    }

    /**
     * Transforme une entité ValeurCritere en DTO
     */
    private mapValeurToDto(valeur: ValeurCritere): ValeurCritereDto {
        return {
            id: valeur.id,
            valeur: valeur.valeur,
            valeur_min: valeur.valeur_min,
            valeur_max: valeur.valeur_max,
            ordre: valeur.ordre,
            created_at: valeur.created_at
        };
    }
}
