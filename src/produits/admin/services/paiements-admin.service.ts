import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Paiement } from '../../entities/paiement.entity';
import {
  PaiementAdminDto,
  PaiementsListQueryDto,
  PaiementsListResponseDto,
} from '../../dto/paiements-admin.dto';

@Injectable()
export class PaiementsAdminService {
  private readonly logger = new Logger(PaiementsAdminService.name);

  constructor(
    @InjectRepository(Paiement)
    private readonly paiementRepository: Repository<Paiement>,
  ) {}

  async getPaiements(
    query: PaiementsListQueryDto,
  ): Promise<PaiementsListResponseDto> {
    this.logger.debug(
      `Récupération des paiements avec filtres ${JSON.stringify(query)}`,
    );
    const qb = this.buildQuery(query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [paiements, total] = await qb.skip(skip).take(limit).getManyAndCount();

    this.logger.debug(
      `Paiements récupérés: ${paiements.length}/${total} (page ${page})`,
    );

    return {
      data: paiements.map((paiement) => this.mapToDto(paiement)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private buildQuery(
    query: PaiementsListQueryDto,
  ): SelectQueryBuilder<Paiement> {
    const qb = this.paiementRepository
      .createQueryBuilder('paiement')
      .leftJoinAndSelect('paiement.utilisateur', 'utilisateur')
      .leftJoinAndSelect('paiement.devisSimule', 'devis')
      .leftJoinAndSelect('devis.produit', 'produit')
      .orderBy('paiement.created_at', 'DESC');

    if (query.statut) {
      qb.andWhere('paiement.statut = :statut', { statut: query.statut });
    }

    if (query.methode) {
      qb.andWhere('paiement.methode_paiement = :methode', {
        methode: query.methode,
      });
    }

    if (query.reference_paiement) {
      qb.andWhere('paiement.reference_paiement LIKE :ref', {
        ref: `%${query.reference_paiement}%`,
      });
    }

    if (query.reference_externe) {
      qb.andWhere('paiement.reference_externe LIKE :refExt', {
        refExt: `%${query.reference_externe}%`,
      });
    }

    if (query.utilisateur_id) {
      qb.andWhere('paiement.utilisateur_id = :utilisateurId', {
        utilisateurId: query.utilisateur_id,
      });
    }

    if (query.devis_id) {
      qb.andWhere('paiement.devis_simule_id = :devisId', {
        devisId: query.devis_id,
      });
    }

    if (query.montant_min !== undefined) {
      qb.andWhere('paiement.montant >= :montantMin', {
        montantMin: query.montant_min,
      });
    }

    if (query.montant_max !== undefined) {
      qb.andWhere('paiement.montant <= :montantMax', {
        montantMax: query.montant_max,
      });
    }

    return qb;
  }

  private mapToDto(paiement: Paiement): PaiementAdminDto {
    this.logger.debug(`Mapping du paiement ${paiement.reference_paiement}`);
    return {
      id: paiement.id,
      reference_paiement: paiement.reference_paiement,
      montant: Number(paiement.montant),
      methode_paiement: paiement.methode_paiement,
      statut: paiement.statut,
      reference_externe: paiement.reference_externe || undefined,
      numero_telephone: paiement.numero_telephone || undefined,
      currency: paiement.currency || undefined,
      date_paiement: paiement.date_paiement || undefined,
      created_at: paiement.created_at,
      updated_at: paiement.updated_at || undefined,
      cinetpay_transaction_id: paiement.cinetpay_transaction_id || undefined,
      operator_id: paiement.operator_id || undefined,
      utilisateur: paiement.utilisateur
        ? {
            id: paiement.utilisateur.id,
            nom: paiement.utilisateur.nom,
            email: paiement.utilisateur.email,
            telephone: paiement.utilisateur.telephone || undefined,
          }
        : undefined,
      devis: paiement.devisSimule
        ? {
            id: paiement.devisSimule.id,
            reference: paiement.devisSimule.reference,
            produit_nom: paiement.devisSimule.produit?.nom || 'Produit inconnu',
          }
        : undefined,
    };
  }
}

