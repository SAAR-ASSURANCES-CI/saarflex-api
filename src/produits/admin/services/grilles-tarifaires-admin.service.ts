import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { GrilleTarifaire, StatutGrille } from '../../entities/grille-tarifaire.entity';
import { Produit } from '../../entities/produit.entity';
import { Tarif } from '../../entities/tarif.entity';
import { 
  CreateGrilleTarifaireDto, 
  UpdateGrilleTarifaireDto, 
  GrilleTarifaireDto,
  GrillesTarifairesResponseDto,
  GrilleTarifaireWithProduitDto,
  GrillesTarifairesWithProduitResponseDto
} from '../../dto/grille-tarifaire.dto';

@Injectable()
export class GrillesTarifairesAdminService {
  constructor(
    @InjectRepository(GrilleTarifaire)
    private grilleRepository: Repository<GrilleTarifaire>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(Tarif)
    private tarifRepository: Repository<Tarif>,
  ) {}

  async create(createGrilleDto: CreateGrilleTarifaireDto, userId: string): Promise<GrilleTarifaireWithProduitDto> {
    const produit = await this.produitRepository.findOne({ 
      where: { id: createGrilleDto.produit_id } 
    });
    if (!produit) {
      throw new NotFoundException('Produit non trouvé');
    }

    // if (createGrilleDto.statut === StatutGrille.ACTIF) {
    //   const conflitGrille = await this.grilleRepository.findOne({
    //     where: {
    //       produit_id: createGrilleDto.produit_id,
    //       statut: StatutGrille.ACTIF,
    //       date_debut: new Date(createGrilleDto.date_debut)
    //     }
    //   });

    //   if (conflitGrille) {
    //     throw new ConflictException('Une grille active existe déjà pour cette date de début');
    //   }
    // }

    const grille = this.grilleRepository.create({
      ...createGrilleDto,
      created_by: userId,
      date_debut: new Date(createGrilleDto.date_debut),
      date_fin: createGrilleDto.date_fin ? new Date(createGrilleDto.date_fin) : undefined,
      statut: createGrilleDto.statut || StatutGrille.INACTIF
    });

    const savedGrille = await this.grilleRepository.save(grille);
    
    const grilleWithRelations = await this.grilleRepository.findOne({
      where: { id: savedGrille.id },
      relations: ['produit', 'produit.branche']
    });
    
    if (!grilleWithRelations) {
      throw new NotFoundException('Erreur lors de la récupération de la grille créée');
    }
    
    return this.mapToDtoWithProduit(grilleWithRelations);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<GrillesTarifairesWithProduitResponseDto> {
    const skip = (page - 1) * limit;
    
    const [grilles, total] = await this.grilleRepository.findAndCount({
      relations: ['produit', 'produit.branche'],
      order: { created_at: 'DESC' },
      skip,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      grilles: grilles.map(grille => this.mapToDtoWithProduit(grille)),
      total,
      page,
      limit,
      totalPages
    };
  }

  async findAllByProduit(produitId: string): Promise<GrilleTarifaireWithProduitDto[]> {
    const grilles = await this.grilleRepository.find({
      where: { produit_id: produitId },
      relations: ['produit', 'produit.branche'],
      order: { date_debut: 'DESC', created_at: 'DESC' }
    });

    return grilles.map(grille => this.mapToDtoWithProduit(grille));
  }

  async findOne(id: string): Promise<GrilleTarifaireWithProduitDto> {
    const grille = await this.grilleRepository.findOne({
      where: { id },
      relations: ['produit', 'produit.branche']
    });

    if (!grille) {
      throw new NotFoundException('Grille tarifaire non trouvée');
    }

    return this.mapToDtoWithProduit(grille);
  }

  async update(id: string, updateGrilleDto: UpdateGrilleTarifaireDto): Promise<GrilleTarifaireWithProduitDto> {
    const grille = await this.grilleRepository.findOne({ 
      where: { id },
      relations: ['produit', 'produit.branche']
    });
    
    if (!grille) {
      throw new NotFoundException('Grille tarifaire non trouvée');
    }

    if (updateGrilleDto.statut === StatutGrille.ACTIF) {
      const dateDebut = updateGrilleDto.date_debut ? new Date(updateGrilleDto.date_debut) : grille.date_debut;
      const conflitGrille = await this.grilleRepository.findOne({
        where: {
          produit_id: grille.produit_id,
          statut: StatutGrille.ACTIF,
          date_debut: dateDebut,
          id: Not(id)
        }
      });

      if (conflitGrille) {
        throw new ConflictException('Une grille active existe déjà pour cette date de début');
      }
    }

    if (updateGrilleDto.nom !== undefined) grille.nom = updateGrilleDto.nom;
    if (updateGrilleDto.date_debut !== undefined) grille.date_debut = new Date(updateGrilleDto.date_debut);
    if (updateGrilleDto.date_fin !== undefined) {
      if (updateGrilleDto.date_fin) {
        grille.date_fin = new Date(updateGrilleDto.date_fin);
      }
      else if (updateGrilleDto.date_fin === null) {
        grille.date_fin = null as unknown as Date;
      }
    }
    if (updateGrilleDto.statut !== undefined) grille.statut = updateGrilleDto.statut;

    const updatedGrille = await this.grilleRepository.save(grille);
    return this.mapToDtoWithProduit(updatedGrille);
  }

  async remove(id: string): Promise<void> {
    const grille = await this.grilleRepository.findOne({ 
      where: { id },
      relations: ['tarifs']
    });
    
    if (!grille) {
      throw new NotFoundException('Grille tarifaire non trouvée');
    }

    if (grille.tarifs && grille.tarifs.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer la grille "${grille.nom}" car elle contient ${grille.tarifs.length} tarif(s)`
      );
    }

    await this.grilleRepository.remove(grille);
  }

  async changeStatus(id: string, newStatus: StatutGrille): Promise<GrilleTarifaireWithProduitDto> {
    const grille = await this.grilleRepository.findOne({ 
      where: { id },
      relations: ['produit', 'produit.branche']
    });
    
    if (!grille) {
      throw new NotFoundException('Grille tarifaire non trouvée');
    }

    if (newStatus === StatutGrille.ACTIF) {
      const conflitGrille = await this.grilleRepository.findOne({
        where: {
          produit_id: grille.produit_id,
          statut: StatutGrille.ACTIF,
          date_debut: grille.date_debut,
          id: Not(id)
        }
      });

      if (conflitGrille) {
        throw new ConflictException('Une grille active existe déjà pour cette date de début');
      }
    }

    grille.statut = newStatus;
    const updatedGrille = await this.grilleRepository.save(grille);
    
    return this.mapToDtoWithProduit(updatedGrille);
  }

  async getTarifsByGrille(grilleId: string): Promise<Tarif[]> {
    const grille = await this.grilleRepository.findOne({ 
      where: { id: grilleId },
      relations: ['tarifs']
    });
    
    if (!grille) {
      throw new NotFoundException('Grille tarifaire non trouvée');
    }

    return grille.tarifs || [];
  }

  private mapToDto(grille: GrilleTarifaire): GrilleTarifaireDto {
    return {
      id: grille.id,
      nom: grille.nom,
      produit_id: grille.produit_id,
      date_debut: grille.date_debut,
      date_fin: grille.date_fin,
      statut: grille.statut,
      created_at: grille.created_at,
      updated_at: grille.updated_at,
      created_by: grille.created_by,
      nombre_tarifs: grille.tarifs ? grille.tarifs.length : 0
    };
  }

  private mapToDtoWithProduit(grille: GrilleTarifaire): GrilleTarifaireWithProduitDto {
    const grilleDto = this.mapToDto(grille);
    
    return {
      ...grilleDto,
      produit: {
        id: grille.produit.id,
        nom: grille.produit.nom,
        icon: grille.produit.icon,
        type: grille.produit.type,
        description: grille.produit.description,
        statut: grille.produit.statut,
        branche: grille.produit.branche ? {
          id: grille.produit.branche.id,
          nom: grille.produit.branche.nom,
          type: grille.produit.branche.type,
          description: grille.produit.branche.description
        } : undefined
      }
    };
  }
}
