import { ApiProperty } from '@nestjs/swagger';
import { StatutDevis } from '../../produits/entities/devis-simule.entity';

/**
 * DTO pour les statistiques principales du dashboard
 */
export class DashboardStatsDto {
  @ApiProperty({ description: 'Statistiques des produits' })
  produits: {
    total: number;
    vie: number;
    nonVie: number;
  };

  @ApiProperty({ description: 'Statistiques des primes collectées' })
  primes: {
    total: number;
    vie: number;
    nonVie: number;
    ceMois: number;
  };

  @ApiProperty({ description: 'Statistiques des clients' })
  clients: {
    total: number;
    actifs: number;
    nouveauxCeMois: number;
  };

  @ApiProperty({ description: 'Statistiques des agents' })
  agents: {
    total: number;
    actifsCeMois: number;
  };

  @ApiProperty({ description: 'Statistiques des devis' })
  devis: {
    total: number;
    enAttente: number;
    sauvegardes: number;
    valides: number;
  };

  @ApiProperty({ description: 'Statistiques des contrats' })
  contrats: {
    total: number;
    actifs: number;
    expires: number;
    resilies: number;
  };
}

/**
 * DTO pour les données de graphiques
 */
export class ChartDataDto {
  @ApiProperty({ description: 'Évolution mensuelle des primes (6 derniers mois)' })
  evolutionPrimes: Array<{
    mois: string;
    vie: number;
    nonVie: number;
    total: number;
  }>;

  @ApiProperty({ description: 'Répartition Vie/Non-vie' })
  repartitionProduits: {
    vie: number;
    nonVie: number;
  };

  @ApiProperty({ description: 'Top 5 produits les plus souscrits' })
  topProduits: Array<{
    id: string;
    nom: string;
    type: string;
    nombreSouscriptions: number;
  }>;

  @ApiProperty({ description: 'Top 5 clients (plus gros contributeurs)' })
  topClients?: Array<{
    id: string;
    nom: string;
    nombreContrats: number;
    primesPayees: number;
  }>;

  @ApiProperty({ description: 'Derniers devis créés' })
  derniersDevis: Array<{
    id: string;
    nomProduit: string;
    client: string;
    montantPrime: number;
    dateCreation: Date;
    statut: string;
    statutCode: StatutDevis;
  }>;
}

/**
 * DTO pour statistiques agent
 */
export class AgentDashboardStatsDto {
  @ApiProperty({ description: 'Statistiques des clients' })
  clients: {
    total: number;
    actifs: number;
    nouveauxCeMois: number;
  };

  @ApiProperty({ description: 'Statistiques des devis' })
  devis: {
    total: number;
    enAttente: number;
    sauvegardes: number;
    valides: number;
  };

  @ApiProperty({ description: 'Statistiques des contrats' })
  contrats: {
    total: number;
    actifs: number;
    expires: number;
  };

  @ApiProperty({ description: 'Statistiques des primes' })
  primes: {
    ceMois: number;
    total: number;
    vie: number;
    nonVie: number;
  };
}

