import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrilleTarifaire, StatutGrille } from '../../entities/grille-tarifaire.entity';
import { Produit, StatutProduit } from '../../entities/produit.entity';
import { GrilleTarifaireWithProduitDto } from '../../dto/grille-tarifaire.dto';

@Injectable()
export class GrillesTarifairesService {
  constructor(
    @InjectRepository(GrilleTarifaire)
    private readonly grilleRepository: Repository<GrilleTarifaire>,
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
  ) {}

  /**
   * Récupère toutes les grilles tarifaires actives d'un produit pour les utilisateurs
   */
  async findAllByProduit(produitId: string): Promise<GrilleTarifaireWithProduitDto[]> {
    // Vérifier que le produit existe et est actif
    const produit = await this.produitRepository.findOne({
      where: { 
        id: produitId,
        statut: StatutProduit.ACTIF 
      },
      relations: ['branche']
    });

    if (!produit) {
      throw new NotFoundException(`Produit avec l'ID ${produitId} non trouvé ou inactif`);
    }

    // Récupérer les grilles tarifaires actives du produit
    const grilles = await this.grilleRepository.find({
      where: { 
        produit_id: produitId,
        statut: StatutGrille.ACTIF 
      },
      relations: ['produit', 'produit.branche'],
      order: { date_debut: 'DESC' }
    });

    // Transformer les données pour inclure les informations du produit
    return grilles.map(grille => ({
      id: grille.id,
      nom: grille.nom,
      produit_id: grille.produit_id,
      date_debut: grille.date_debut,
      date_fin: grille.date_fin,
      statut: grille.statut,
      created_at: grille.created_at,
      updated_at: grille.updated_at,
      created_by: grille.created_by,
      nombre_tarifs: grille.tarifs ? grille.tarifs.length : 0,
      produit: {
        id: produit.id,
        nom: produit.nom,
        description: produit.description,
        type: produit.type,
        statut: produit.statut,
        branche: {
          id: produit.branche.id,
          nom: produit.branche.nom,
          type: produit.branche.type
        }
      }
    }));
  }

  /**
   * Récupère une grille tarifaire active par ID pour les utilisateurs
   */
  async findOne(id: string): Promise<GrilleTarifaireWithProduitDto> {
    const grille = await this.grilleRepository.findOne({
      where: { 
        id,
        statut: StatutGrille.ACTIF 
      },
      relations: ['produit', 'produit.branche']
    });

    if (!grille) {
      throw new NotFoundException(`Grille tarifaire avec l'ID ${id} non trouvée ou inactive`);
    }

    // Vérifier que le produit associé est actif
    if (grille.produit.statut !== StatutProduit.ACTIF) {
      throw new NotFoundException(`Produit associé à la grille tarifaire est inactif`);
    }

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
      nombre_tarifs: grille.tarifs ? grille.tarifs.length : 0,
      produit: {
        id: grille.produit.id,
        nom: grille.produit.nom,
        description: grille.produit.description,
        type: grille.produit.type,
        statut: grille.produit.statut,
        branche: {
          id: grille.produit.branche.id,
          nom: grille.produit.branche.nom,
          type: grille.produit.branche.type
        }
      }
    };
  }
}
