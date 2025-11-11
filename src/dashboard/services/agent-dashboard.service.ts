import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrat, StatutContrat } from '../../produits/entities/contrat.entity';
import { DevisSimule, StatutDevis } from '../../produits/entities/devis-simule.entity';
import { Paiement, StatutPaiement } from '../../produits/entities/paiement.entity';
import { User, UserType } from '../../users/entities/user.entity';
import { TypeProduit } from '../../produits/entities/produit.entity';
import { AgentDashboardStatsDto, ChartDataDto } from '../dto/dashboard-stats.dto';

@Injectable()
export class AgentDashboardService {
  constructor(
    @InjectRepository(Contrat)
    private readonly contratRepository: Repository<Contrat>,
    @InjectRepository(DevisSimule)
    private readonly devisRepository: Repository<DevisSimule>,
    @InjectRepository(Paiement)
    private readonly paiementRepository: Repository<Paiement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Récupérer les statistiques pour un agent
   * Note: Les agents voient TOUTES les données (pas d'assignation agent-client)
   */
  async getStats(): Promise<AgentDashboardStatsDto> {
    console.log('[AgentDashboard] Récupération des statistiques...'); // Debug logging

    const [clients, devis, contrats, primes] = await Promise.all([
      this.getClientsStats(),
      this.getDevisStats(),
      this.getContratsStats(),
      this.getPrimesStats(),
    ]);

    console.log('[AgentDashboard] Statistiques récupérées avec succès'); // Debug logging

    return {
      clients,
      devis,
      contrats,
      primes,
    };
  }

  /**
   * Récupérer les données pour les graphiques
   */
  async getChartData(): Promise<ChartDataDto> {
    console.log('[AgentDashboard] Récupération des données de graphiques...'); // Debug logging

    const [
      evolutionPrimes,
      repartitionProduits,
      topProduits,
      derniersDevis,
    ] = await Promise.all([
      this.getEvolutionPrimes(),
      this.getRepartitionProduits(),
      this.getTopProduits(),
      this.getDerniersDevis(),
    ]);

    return {
      evolutionPrimes,
      repartitionProduits,
      topProduits,
      derniersDevis,
    };
  }

  /**
   * Statistiques des clients (tous)
   */
  private async getClientsStats() {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = await this.userRepository.count({
      where: { type_utilisateur: UserType.CLIENT },
    });

    const actifs = await this.userRepository.count({
      where: { type_utilisateur: UserType.CLIENT, statut: true },
    });

    const nouveauxCeMois = await this.userRepository
      .createQueryBuilder('user')
      .where('user.type_utilisateur = :type', { type: UserType.CLIENT })
      .andWhere('user.date_creation >= :debutMois', { debutMois })
      .getCount();

    return { total, actifs, nouveauxCeMois };
  }

  /**
   * Statistiques des devis (tous)
   */
  private async getDevisStats() {
    const total = await this.devisRepository.count();

    const sauvegardes = await this.devisRepository.count({
      where: { statut: StatutDevis.SAUVEGARDE },
    });

    const valides = await this.devisRepository
      .createQueryBuilder('devis')
      .innerJoin('contrats', 'contrat', 'contrat.devis_simule_id = devis.id')
      .getCount();

    const enAttente = sauvegardes;

    return { total, enAttente, sauvegardes, valides };
  }

  /**
   * Statistiques des contrats (tous)
   */
  private async getContratsStats() {
    const total = await this.contratRepository.count();

    const actifs = await this.contratRepository.count({
      where: { statut: StatutContrat.ACTIF },
    });

    const expires = await this.contratRepository.count({
      where: { statut: StatutContrat.EXPIRE },
    });

    return { total, actifs, expires };
  }

  /**
   * Statistiques des primes (toutes)
   */
  private async getPrimesStats() {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total
    const totalResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .getRawOne();

    // Ce mois
    const ceMoisResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere('paiement.date_paiement >= :debutMois', { debutMois })
      .getRawOne();

    // Vie
    const vieResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .innerJoin('paiement.contrat', 'contrat')
      .innerJoin('contrat.produit', 'produit')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere('produit.type = :type', { type: TypeProduit.VIE })
      .getRawOne();

    // Non-vie
    const nonVieResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .innerJoin('paiement.contrat', 'contrat')
      .innerJoin('contrat.produit', 'produit')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere('produit.type = :type', { type: TypeProduit.NON_VIE })
      .getRawOne();

    return {
      total: parseFloat(totalResult?.total || 0),
      ceMois: parseFloat(ceMoisResult?.total || 0),
      vie: parseFloat(vieResult?.total || 0),
      nonVie: parseFloat(nonVieResult?.total || 0),
    };
  }

  /**
   * Évolution des primes sur 6 mois
   */
  private async getEvolutionPrimes() {
    const moisData: Array<{ mois: string; total: number; vie: number; nonVie: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const debutMois = new Date(date.getFullYear(), date.getMonth(), 1);
      const finMois = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const nomMois = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

      const totalResult = await this.paiementRepository
        .createQueryBuilder('paiement')
        .select('SUM(paiement.montant)', 'total')
        .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
        .andWhere('paiement.date_paiement >= :debut', { debut: debutMois })
        .andWhere('paiement.date_paiement <= :fin', { fin: finMois })
        .getRawOne();

      const vieResult = await this.paiementRepository
        .createQueryBuilder('paiement')
        .innerJoin('paiement.contrat', 'contrat')
        .innerJoin('contrat.produit', 'produit')
        .select('SUM(paiement.montant)', 'total')
        .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
        .andWhere('produit.type = :type', { type: TypeProduit.VIE })
        .andWhere('paiement.date_paiement >= :debut', { debut: debutMois })
        .andWhere('paiement.date_paiement <= :fin', { fin: finMois })
        .getRawOne();

      const nonVieResult = await this.paiementRepository
        .createQueryBuilder('paiement')
        .innerJoin('paiement.contrat', 'contrat')
        .innerJoin('contrat.produit', 'produit')
        .select('SUM(paiement.montant)', 'total')
        .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
        .andWhere('produit.type = :type', { type: TypeProduit.NON_VIE })
        .andWhere('paiement.date_paiement >= :debut', { debut: debutMois })
        .andWhere('paiement.date_paiement <= :fin', { fin: finMois })
        .getRawOne();

      moisData.push({
        mois: nomMois,
        total: parseFloat(totalResult?.total || 0),
        vie: parseFloat(vieResult?.total || 0),
        nonVie: parseFloat(nonVieResult?.total || 0),
      });
    }

    return moisData;
  }

  /**
   * Répartition Vie/Non-vie
   */
  private async getRepartitionProduits() {
    const vie = await this.contratRepository
      .createQueryBuilder('contrat')
      .innerJoin('contrat.produit', 'produit')
      .where('produit.type = :type', { type: TypeProduit.VIE })
      .andWhere('contrat.statut = :statut', { statut: StatutContrat.ACTIF })
      .getCount();

    const nonVie = await this.contratRepository
      .createQueryBuilder('contrat')
      .innerJoin('contrat.produit', 'produit')
      .where('produit.type = :type', { type: TypeProduit.NON_VIE })
      .andWhere('contrat.statut = :statut', { statut: StatutContrat.ACTIF })
      .getCount();

    return { vie, nonVie };
  }

  /**
   * Top 5 produits
   */
  private async getTopProduits() {
    const results = await this.contratRepository
      .createQueryBuilder('contrat')
      .innerJoin('contrat.produit', 'produit')
      .select('produit.id', 'id')
      .addSelect('produit.nom', 'nom')
      .addSelect('produit.type', 'type')
      .addSelect('COUNT(contrat.id)', 'nombreSouscriptions')
      .groupBy('produit.id')
      .orderBy('nombreSouscriptions', 'DESC')
      .limit(5)
      .getRawMany();

    return results.map((r) => ({
      id: r.id,
      nom: r.nom,
      type: r.type,
      nombreSouscriptions: parseInt(r.nombreSouscriptions, 10),
    }));
  }

  /**
   * Derniers devis créés
   */
  private async getDerniersDevis() {
    const devis = await this.devisRepository
      .createQueryBuilder('devis')
      .innerJoinAndSelect('devis.produit', 'produit')
      .leftJoinAndSelect('devis.utilisateur', 'utilisateur')
      .orderBy('devis.created_at', 'DESC')
      .limit(10)
      .getMany();

    return devis.map((d) => ({
      id: d.id,
      nomProduit: d.produit.nom,
      client: d.utilisateur?.nom || 'Client anonyme',
      montantPrime: Number(d.prime_calculee),
      dateCreation: d.created_at,
      statutCode: d.statut,
      statut: this.formatDevisStatus(d.statut),
    }));
  }

  private formatDevisStatus(statut: StatutDevis): string {
    switch (statut) {
      case StatutDevis.SAUVEGARDE:
        return 'Sauvegardé';
      case StatutDevis.EN_ATTENTE_PAIEMENT:
        return 'En attente de paiement';
      case StatutDevis.PAYE:
        return 'Payé';
      case StatutDevis.CONVERTI_EN_CONTRAT:
        return 'Converti en contrat';
      case StatutDevis.EXPIRE:
        return 'Expiré';
      case StatutDevis.SIMULATION:
      default:
        return 'Simulé';
    }
  }
}

