import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarif } from '../../entities/tarif.entity';
import { GrilleTarifaire, StatutGrille } from '../../entities/grille-tarifaire.entity';
import {
  CreateTarifDto,
  UpdateTarifDto,
  TarifDto,
  TarifsResponseDto,
  TarifWithGrilleDto,
  TarifsWithGrilleResponseDto
} from '../../dto/tarif.dto';

@Injectable()
export class TarifsAdminService {
  constructor(
    @InjectRepository(Tarif)
    private tarifRepository: Repository<Tarif>,
    @InjectRepository(GrilleTarifaire)
    private grilleRepository: Repository<GrilleTarifaire>
  ) { }

  async create(createTarifDto: CreateTarifDto): Promise<TarifWithGrilleDto> {
    const grille = await this.grilleRepository.findOne({
      where: { id: createTarifDto.grille_id }
    });
    if (!grille) {
      throw new NotFoundException('Grille tarifaire non trouvée');
    }

    if (grille.statut !== StatutGrille.ACTIF) {
      throw new BadRequestException('Impossible d\'ajouter un tarif à une grille inactive');
    }

    const tarif = this.tarifRepository.create(createTarifDto);
    const savedTarif = await this.tarifRepository.save(tarif);

    const tarifWithRelations = await this.tarifRepository.findOne({
      where: { id: savedTarif.id },
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche']
    });

    if (!tarifWithRelations) {
      throw new NotFoundException('Erreur lors de la récupération du tarif créé');
    }

    return this.mapToDtoWithGrille(tarifWithRelations);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<TarifsWithGrilleResponseDto> {
    const skip = (page - 1) * limit;

    const [tarifs, total] = await this.tarifRepository.findAndCount({
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche'],
      order: { created_at: 'DESC' },
      skip,
      take: limit
    });

    return {
      tarifs: tarifs.map(tarif => this.mapToDtoWithGrille(tarif)),
      total,
      page,
      limit
    };
  }

  async findAllByGrille(grilleId: string): Promise<TarifWithGrilleDto[]> {
    const tarifs = await this.tarifRepository.find({
      where: { grille_id: grilleId },
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche'],
      order: { created_at: 'DESC' }
    });

    return tarifs.map(tarif => this.mapToDtoWithGrille(tarif));
  }

  async findAllByProduit(produitId: string): Promise<TarifWithGrilleDto[]> {
    const tarifs = await this.tarifRepository.find({
      where: { grilleTarifaire: { produit_id: produitId } },
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche'],
      order: { created_at: 'DESC' }
    });

    return tarifs.map(tarif => this.mapToDtoWithGrille(tarif));
  }

  async findOne(id: string): Promise<TarifWithGrilleDto> {
    const tarif = await this.tarifRepository.findOne({
      where: { id },
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche']
    });

    if (!tarif) {
      throw new NotFoundException('Tarif non trouvé');
    }

    return this.mapToDtoWithGrille(tarif);
  }

  async update(id: string, updateTarifDto: UpdateTarifDto): Promise<TarifWithGrilleDto> {
    const tarif = await this.tarifRepository.findOne({ where: { id } });
    if (!tarif) {
      throw new NotFoundException('Tarif non trouvé');
    }

    if (updateTarifDto.grille_id !== undefined) tarif.grille_id = updateTarifDto.grille_id;
    if (updateTarifDto.type_calcul !== undefined) tarif.type_calcul = updateTarifDto.type_calcul;
    if (updateTarifDto.montant_fixe !== undefined) tarif.montant_fixe = updateTarifDto.montant_fixe;
    if (updateTarifDto.taux_pourcentage !== undefined) tarif.taux_pourcentage = updateTarifDto.taux_pourcentage;
    if (updateTarifDto.formule_calcul !== undefined) tarif.formule_calcul = updateTarifDto.formule_calcul;
    if (updateTarifDto.critere_id !== undefined) tarif.critere_id = updateTarifDto.critere_id;
    if (updateTarifDto.valeur_critere_id !== undefined) tarif.valeur_critere_id = updateTarifDto.valeur_critere_id;
    if (updateTarifDto.criteres_combines !== undefined) tarif.criteres_combines = updateTarifDto.criteres_combines;

    const updatedTarif = await this.tarifRepository.save(tarif);

    const tarifWithRelations = await this.tarifRepository.findOne({
      where: { id: updatedTarif.id },
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche']
    });

    if (!tarifWithRelations) {
      throw new NotFoundException('Erreur lors de la récupération du tarif mis à jour');
    }

    return this.mapToDtoWithGrille(tarifWithRelations);
  }

  async remove(id: string): Promise<void> {
    const tarif = await this.tarifRepository.findOne({ where: { id } });
    if (!tarif) {
      throw new NotFoundException('Tarif non trouvé');
    }

    await this.tarifRepository.remove(tarif);
  }

  async findTarifsByCriteres(grilleId: string, criteres: Record<string, any>): Promise<TarifDto[]> {
    const tarifs = await this.tarifRepository.find({
      where: { grille_id: grilleId },
      relations: ['critere', 'valeurCritere']
    });

    // Filtrer les tarifs selon les critères fournis
    const tarifsCorrespondants = tarifs.filter(tarif => {
      if (tarif.critere_id && criteres[tarif.critere.nom]) {
        if (tarif.valeur_critere_id) {
          return tarif.valeurCritere.valeur === criteres[tarif.critere.nom];
        }
        return true;
      }
      return false;
    });

    return tarifsCorrespondants.map(tarif => this.mapToDto(tarif));
  }

  async calculatePrime(grilleId: string, criteres: Record<string, any>): Promise<{
    tarif: TarifDto;
    prime_calculee: number;
    montant_fixe: number;
  }> {
    const tarifs = await this.findTarifsByCriteres(grilleId, criteres);

    if (tarifs.length === 0) {
      throw new NotFoundException('Aucun tarif trouvé pour les critères donnés');
    }

    const tarifDto = tarifs[0];

    const tarif = await this.tarifRepository.findOne({
      where: { id: tarifDto.id },
      relations: ['grilleTarifaire', 'grilleTarifaire.produit', 'grilleTarifaire.produit.branche']
    });

    if (!tarif) {
      throw new NotFoundException('Erreur lors de la récupération du tarif');
    }

    // Système simplifié : la prime calculée = montant fixe
    const prime_calculee = tarif.montant_fixe;

    return {
      tarif: this.mapToDto(tarif),
      prime_calculee: Math.round(prime_calculee * 100) / 100,
      montant_fixe: tarif.montant_fixe
    };
  }


  private mapToDto(tarif: Tarif): TarifDto {
    return {
      id: tarif.id,
      grille_id: tarif.grille_id,
      type_calcul: tarif.type_calcul,
      montant_fixe: tarif.montant_fixe,
      taux_pourcentage: tarif.taux_pourcentage,
      formule_calcul: tarif.formule_calcul,
      critere_id: tarif.critere_id,
      valeur_critere_id: tarif.valeur_critere_id,
      criteres_combines: tarif.criteres_combines,
      created_at: tarif.created_at
    };
  }

  private mapToDtoWithGrille(tarif: Tarif): TarifWithGrilleDto {
    const tarifDto = this.mapToDto(tarif);

    return {
      ...tarifDto,
      grilleTarifaire: {
        id: tarif.grilleTarifaire.id,
        nom: tarif.grilleTarifaire.nom,
        statut: tarif.grilleTarifaire.statut,
        produit: {
          id: tarif.grilleTarifaire.produit.id,
          nom: tarif.grilleTarifaire.produit.nom,
          type: tarif.grilleTarifaire.produit.type,
          branche: {
            id: tarif.grilleTarifaire.produit.branche.id,
            nom: tarif.grilleTarifaire.produit.branche.nom,
            type: tarif.grilleTarifaire.produit.branche.type
          }
        }
      }
    };
  }
}
