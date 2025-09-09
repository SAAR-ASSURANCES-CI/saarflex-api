import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Garantie } from '../../entities/garantie.entity';
import { GarantieCritere } from '../../entities/garantie-critere.entity';
import { TarifGarantie } from '../../entities/tarif-garantie.entity';
import { Produit } from '../../entities/produit.entity';
import { 
  CreateGarantieDto, 
  UpdateGarantieDto, 
  GarantieDto,
  GarantiesResponseDto,
  CreateGarantieCritereDto,
  UpdateGarantieCritereDto,
  GarantieCritereDto,
  CreateTarifGarantieDto,
  UpdateTarifGarantieDto,
  TarifGarantieDto,
  GarantieWithProduitDto,
  GarantiesWithProduitResponseDto
} from '../../dto/garanties-index.dto';

@Injectable()
export class GarantiesAdminService {
  constructor(
    @InjectRepository(Garantie)
    private garantieRepository: Repository<Garantie>,
    @InjectRepository(GarantieCritere)
    private garantieCritereRepository: Repository<GarantieCritere>,
    @InjectRepository(TarifGarantie)
    private tarifGarantieRepository: Repository<TarifGarantie>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
  ) {}

  async create(createGarantieDto: CreateGarantieDto, userId: string): Promise<GarantieWithProduitDto> {
    const produit = await this.produitRepository.findOne({ 
      where: { id: createGarantieDto.produit_id } 
    });
    if (!produit) {
      throw new NotFoundException('Produit non trouvé');
    }

    const garantie = this.garantieRepository.create({
      ...createGarantieDto,
      created_by: userId,
      franchise: createGarantieDto.franchise || 0,
      ordre: createGarantieDto.ordre || 0
    });

    const savedGarantie = await this.garantieRepository.save(garantie);
    
    // Récupérer la garantie avec les relations pour le retour
    const garantieWithRelations = await this.garantieRepository.findOne({
      where: { id: savedGarantie.id },
      relations: ['produit', 'produit.branche']
    });
    
    if (!garantieWithRelations) {
      throw new NotFoundException('Erreur lors de la récupération de la garantie créée');
    }
    
    return this.mapToDtoWithProduit(garantieWithRelations);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<GarantiesWithProduitResponseDto> {
    const skip = (page - 1) * limit;
    
    const [garanties, total] = await this.garantieRepository.findAndCount({
      relations: ['produit', 'produit.branche'],
      order: { created_at: 'DESC' },
      skip,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      garanties: garanties.map(garantie => this.mapToDtoWithProduit(garantie)),
      total,
      page,
      limit,
      totalPages
    };
  }

  async findAllByProduit(produitId: string): Promise<GarantieWithProduitDto[]> {
    const garanties = await this.garantieRepository.find({
      where: { produit_id: produitId },
      relations: ['produit', 'produit.branche'],
      order: { ordre: 'ASC', created_at: 'DESC' }
    });

    return garanties.map(garantie => this.mapToDtoWithProduit(garantie));
  }

  async findOne(id: string): Promise<GarantieWithProduitDto> {
    const garantie = await this.garantieRepository.findOne({
      where: { id },
      relations: ['produit', 'produit.branche']
    });

    if (!garantie) {
      throw new NotFoundException('Garantie non trouvée');
    }

    return this.mapToDtoWithProduit(garantie);
  }

  async update(id: string, updateGarantieDto: UpdateGarantieDto): Promise<GarantieWithProduitDto> {
    const garantie = await this.garantieRepository.findOne({ where: { id } });
    if (!garantie) {
      throw new NotFoundException('Garantie non trouvée');
    }

    Object.assign(garantie, updateGarantieDto);
    const updatedGarantie = await this.garantieRepository.save(garantie);
    
    // Récupérer la garantie mise à jour avec les relations
    const garantieWithRelations = await this.garantieRepository.findOne({
      where: { id: updatedGarantie.id },
      relations: ['produit', 'produit.branche']
    });
    
    if (!garantieWithRelations) {
      throw new NotFoundException('Erreur lors de la récupération de la garantie mise à jour');
    }
    
    return this.mapToDtoWithProduit(garantieWithRelations);
  }

  async remove(id: string): Promise<void> {
    const garantie = await this.garantieRepository.findOne({ where: { id } });
    if (!garantie) {
      throw new NotFoundException('Garantie non trouvée');
    }

    await this.garantieRepository.remove(garantie);
  }

  async addCritere(garantieId: string, createCritereDto: CreateGarantieCritereDto): Promise<GarantieCritereDto> {
    const garantie = await this.garantieRepository.findOne({ where: { id: garantieId } });
    if (!garantie) {
      throw new NotFoundException('Garantie non trouvée');
    }

    const garantieCritere = this.garantieCritereRepository.create({
      ...createCritereDto,
      garantie_id: garantieId
    });

    const savedCritere = await this.garantieCritereRepository.save(garantieCritere);
    return this.mapCritereToDto(savedCritere);
  }

  async updateCritere(id: string, updateCritereDto: UpdateGarantieCritereDto): Promise<GarantieCritereDto> {
    const garantieCritere = await this.garantieCritereRepository.findOne({ where: { id } });
    if (!garantieCritere) {
      throw new NotFoundException('Critère de garantie non trouvé');
    }

    Object.assign(garantieCritere, updateCritereDto);
    const updatedCritere = await this.garantieCritereRepository.save(garantieCritere);
    
    return this.mapCritereToDto(updatedCritere);
  }

  async removeCritere(id: string): Promise<void> {
    const garantieCritere = await this.garantieCritereRepository.findOne({ where: { id } });
    if (!garantieCritere) {
      throw new NotFoundException('Critère de garantie non trouvé');
    }

    await this.garantieCritereRepository.remove(garantieCritere);
  }

  async getCriteresByGarantie(garantieId: string): Promise<GarantieCritereDto[]> {
    const criteres = await this.garantieCritereRepository.find({
      where: { garantie_id: garantieId },
      relations: ['critere']
    });

    return criteres.map(critere => this.mapCritereToDto(critere));
  }

  async createTarif(createTarifDto: CreateTarifGarantieDto, userId: string): Promise<TarifGarantieDto> {
    const garantie = await this.garantieRepository.findOne({ where: { id: createTarifDto.garantie_id } });
    if (!garantie) {
      throw new NotFoundException('Garantie non trouvée');
    }

    const tarif = this.tarifGarantieRepository.create({
      ...createTarifDto,
      created_by: userId,
      date_debut: new Date(createTarifDto.date_debut),
      date_fin: createTarifDto.date_fin ? new Date(createTarifDto.date_fin) : undefined
    });

    const savedTarif = await this.tarifGarantieRepository.save(tarif);
    return this.mapTarifToDto(savedTarif);

  }

  async updateTarif(id: string, updateTarifDto: UpdateTarifGarantieDto): Promise<TarifGarantieDto> {
    const tarif = await this.tarifGarantieRepository.findOne({ where: { id } });
    if (!tarif) {
      throw new NotFoundException('Tarif de garantie non trouvé');
    }

    const updateData: any = { ...updateTarifDto };
    
    if (updateTarifDto.date_debut) {
      updateData.date_debut = new Date(updateTarifDto.date_debut);
    }
    if (updateTarifDto.date_fin) {
      updateData.date_fin = new Date(updateTarifDto.date_fin);
    }

    Object.assign(tarif, updateData);
    const updatedTarif = await this.tarifGarantieRepository.save(tarif);
    
    return this.mapTarifToDto(updatedTarif);
  }

  async removeTarif(id: string): Promise<void> {
    const tarif = await this.tarifGarantieRepository.findOne({ where: { id } });
    if (!tarif) {
      throw new NotFoundException('Tarif de garantie non trouvé');
    }

    await this.tarifGarantieRepository.remove(tarif);
  }

  async getTarifsByGarantie(garantieId: string): Promise<TarifGarantieDto[]> {
    const tarifs = await this.tarifGarantieRepository.find({
      where: { garantie_id: garantieId },
      order: { date_debut: 'DESC' }
    });

    return tarifs.map(tarif => this.mapTarifToDto(tarif));
  }

  private mapToDto(garantie: Garantie): GarantieDto {
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
      updated_at: garantie.updated_at
    };
  }

  private mapToDtoWithProduit(garantie: Garantie): GarantieWithProduitDto {
    const garantieDto = this.mapToDto(garantie);
    
    return {
      ...garantieDto,
      produit: {
        id: garantie.produit.id,
        nom: garantie.produit.nom,
        icon: garantie.produit.icon,
        type: garantie.produit.type,
        description: garantie.produit.description,
        statut: garantie.produit.statut,
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

  private mapCritereToDto(critere: GarantieCritere): GarantieCritereDto {
    return {
      id: critere.id,
      garantie_id: critere.garantie_id,
      critere_id: critere.critere_id,
      valeur_requise: critere.valeur_requise,
      valeur_min_requise: critere.valeur_min_requise,
      valeur_max_requise: critere.valeur_max_requise,
      operateur: critere.operateur,
      created_at: critere.created_at,
      critere_nom: critere.critere?.nom,
      critere_type: critere.critere?.type,
      critere_unite: critere.critere?.unite
    };
  }

  private mapTarifToDto(tarif: TarifGarantie): TarifGarantieDto {
    return {
      id: tarif.id,
      garantie_id: tarif.garantie_id,
      montant_base: tarif.montant_base,
      pourcentage_produit: tarif.pourcentage_produit,
      formule_calcul: tarif.formule_calcul,
      date_debut: tarif.date_debut,
      date_fin: tarif.date_fin,
      statut: tarif.statut,
      created_by: tarif.created_by,
      created_at: tarif.created_at,
      updated_at: tarif.updated_at
    };
  }
}
