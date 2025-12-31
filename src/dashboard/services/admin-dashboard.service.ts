import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit, StatutProduit, TypeProduit } from '../../produits/entities/produit.entity';
import { Contrat, StatutContrat } from '../../produits/entities/contrat.entity';
import { DevisSimule, StatutDevis } from '../../produits/entities/devis-simule.entity';
import { Paiement, StatutPaiement } from '../../produits/entities/paiement.entity';
import { User, UserType } from '../../users/entities/user.entity';
import { DashboardStatsDto, ChartDataDto } from '../dto/dashboard-stats.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Produit)
    private readonly produitRepository: Repository<Produit>,
    @InjectRepository(Contrat)
    private readonly contratRepository: Repository<Contrat>,
    @InjectRepository(DevisSimule)
    private readonly devisRepository: Repository<DevisSimule>,
    @InjectRepository(Paiement)
    private readonly paiementRepository: Repository<Paiement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Récupérer les statistiques globales pour l'admin
   */
  async getStats(): Promise<DashboardStatsDto> {
    const [
      produits,
      primes,
      clients,
      agents,
      devis,
      contrats,
    ] = await Promise.all([
      this.getProduitsStats(),
      this.getPrimesStats(),
      this.getClientsStats(),
      this.getAgentsStats(),
      this.getDevisStats(),
      this.getContratsStats(),
    ]);

    return {
      produits,
      primes,
      clients,
      agents,
      devis,
      contrats,
    };
  }

  /**
   * Récupérer les données pour les graphiques
   */
  async getChartData(): Promise<ChartDataDto> {

    const [
      evolutionPrimes,
      repartitionProduits,
      topProduits,
      topClients,
      derniersDevis,
    ] = await Promise.all([
      this.getEvolutionPrimes(),
      this.getRepartitionProduits(),
      this.getTopProduits(),
      this.getTopClients(),
      this.getDerniersDevis(),
    ]);

    return {
      evolutionPrimes,
      repartitionProduits,
      topProduits,
      topClients,
      derniersDevis,
    };
  }

  /**
   * Statistiques des produits
   */
  private async getProduitsStats() {
    const total = await this.produitRepository.count({
      where: { statut: StatutProduit.ACTIF }
    });
    const vie = await this.produitRepository.count({
      where: { type: TypeProduit.VIE, statut: StatutProduit.ACTIF },
    });
    const nonVie = await this.produitRepository.count({
      where: { type: TypeProduit.NON_VIE, statut: StatutProduit.ACTIF },
    });

    return { total, vie, nonVie };
  }

  /**
   * Statistiques des primes collectées
   */
  private async getPrimesStats() {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total des primes payées
    const totalResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .getRawOne();

    // Primes ce mois
    const ceMoisResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere('paiement.date_paiement >= :debutMois', { debutMois })
      .getRawOne();

    const vieResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .leftJoin('paiement.contrat', 'contrat')
      .leftJoin('paiement.devisSimule', 'devis')
      .leftJoin('contrat.produit', 'produitContrat')
      .leftJoin('devis.produit', 'produitDevis')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere(
        '(produitContrat.type = :typeVie OR (contrat.id IS NULL AND produitDevis.type = :typeVie))',
        { typeVie: TypeProduit.VIE },
      )
      .getRawOne();

    const nonVieResult = await this.paiementRepository
      .createQueryBuilder('paiement')
      .leftJoin('paiement.contrat', 'contrat')
      .leftJoin('paiement.devisSimule', 'devis')
      .leftJoin('contrat.produit', 'produitContrat')
      .leftJoin('devis.produit', 'produitDevis')
      .select('SUM(paiement.montant)', 'total')
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere(
        '(produitContrat.type = :typeNonVie OR (contrat.id IS NULL AND produitDevis.type = :typeNonVie))',
        { typeNonVie: TypeProduit.NON_VIE },
      )
      .getRawOne();

    return {
      total: parseFloat(totalResult?.total || 0),
      ceMois: parseFloat(ceMoisResult?.total || 0),
      vie: parseFloat(vieResult?.total || 0),
      nonVie: parseFloat(nonVieResult?.total || 0),
    };
  }

  /**
   * Statistiques des clients
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
   * Statistiques des agents
   */
  private async getAgentsStats() {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = await this.userRepository.count({
      where: { type_utilisateur: UserType.AGENT },
    });

    const actifsCeMois = await this.userRepository
      .createQueryBuilder('user')
      .where('user.type_utilisateur = :type', { type: UserType.AGENT })
      .andWhere('user.derniere_connexion >= :debutMois', { debutMois })
      .getCount();

    return { total, actifsCeMois };
  }

  /**
   * Statistiques des devis
   */
  private async getDevisStats() {
    const total = await this.devisRepository.count();

    // Devis sauvegardés
    const sauvegardes = await this.devisRepository.count({
      where: { statut: StatutDevis.SAUVEGARDE },
    });

    // Devis validés (avec contrat)
    const valides = await this.devisRepository
      .createQueryBuilder('devis')
      .innerJoin('contrats', 'contrat', 'contrat.devis_simule_id = devis.id')
      .getCount();

    const enAttente = sauvegardes;

    return { total, enAttente, sauvegardes, valides };
  }

  /**
   * Statistiques des contrats
   */
  private async getContratsStats() {
    const total = await this.contratRepository.count();

    const actifs = await this.contratRepository.count({
      where: { statut: StatutContrat.ACTIF },
    });

    const expires = await this.contratRepository.count({
      where: { statut: StatutContrat.EXPIRE },
    });

    const resilies = await this.contratRepository.count({
      where: { statut: StatutContrat.RESILIE },
    });

    return { total, actifs, expires, resilies };
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

      // Total
      const totalResult = await this.paiementRepository
        .createQueryBuilder('paiement')
        .select('SUM(paiement.montant)', 'total')
        .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
        .andWhere('paiement.date_paiement >= :debut', { debut: debutMois })
        .andWhere('paiement.date_paiement <= :fin', { fin: finMois })
        .getRawOne();

      const vieResult = await this.paiementRepository
        .createQueryBuilder('paiement')
        .leftJoin('paiement.contrat', 'contrat')
        .leftJoin('paiement.devisSimule', 'devis')
        .leftJoin('contrat.produit', 'produitContrat')
        .leftJoin('devis.produit', 'produitDevis')
        .select('SUM(paiement.montant)', 'total')
        .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
        .andWhere(
          '(produitContrat.type = :typeVie OR (contrat.id IS NULL AND produitDevis.type = :typeVie))',
          { typeVie: TypeProduit.VIE },
        )
        .andWhere('paiement.date_paiement >= :debut', { debut: debutMois })
        .andWhere('paiement.date_paiement <= :fin', { fin: finMois })
        .getRawOne();

      const nonVieResult = await this.paiementRepository
        .createQueryBuilder('paiement')
        .leftJoin('paiement.contrat', 'contrat')
        .leftJoin('paiement.devisSimule', 'devis')
        .leftJoin('contrat.produit', 'produitContrat')
        .leftJoin('devis.produit', 'produitDevis')
        .select('SUM(paiement.montant)', 'total')
        .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
        .andWhere(
          '(produitContrat.type = :typeNonVie OR (contrat.id IS NULL AND produitDevis.type = :typeNonVie))',
          { typeNonVie: TypeProduit.NON_VIE },
        )
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
   * Répartition des produits Vie/Non-vie
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
   * Top 5 produits les plus souscrits
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
   * Top 5 clients (meilleurs contributeurs)
   */
  private async getTopClients() {
    const results = await this.paiementRepository
      .createQueryBuilder('paiement')
      .innerJoin('users', 'user', 'user.id = paiement.utilisateur_id')
      .select('user.id', 'id')
      .addSelect('user.nom', 'nom')
      .addSelect('SUM(paiement.montant)', 'primesPayees')
      .addSelect(
        '(SELECT COUNT(c.id) FROM contrats c WHERE c.utilisateur_id = user.id)',
        'nombreContrats'
      )
      .where('paiement.statut = :statut', { statut: StatutPaiement.REUSSI })
      .andWhere('user.type_utilisateur = :clientType', { clientType: UserType.CLIENT })
      .groupBy('user.id')
      .addGroupBy('user.nom')
      .orderBy('primesPayees', 'DESC')
      .limit(5)
      .getRawMany();

    return results
      .filter((r) => r.id)
      .map((r) => ({
        id: r.id,
        nom: r.nom,
        nombreContrats: parseInt(r.nombreContrats || '0', 10),
        primesPayees: parseFloat(r.primesPayees || '0'),
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

