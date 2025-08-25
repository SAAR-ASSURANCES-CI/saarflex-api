import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DevisSauvegardeService } from '../public/services/devis-sauvegarde.service';

@Injectable()
export class TachePlanifieeService implements OnModuleInit {
  private readonly logger = new Logger(TachePlanifieeService.name);
  private nettoyageInterval: NodeJS.Timeout;

  constructor(
    private readonly devisSauvegardeService: DevisSauvegardeService,
  ) {}

  onModuleInit() {
    // Démarrer le nettoyage automatique toutes les heures
    this.nettoyageInterval = setInterval(() => {
      this.nettoyerDevisExpires();
    }, 60 * 60 * 1000); // 1 heure

    // Nettoyer immédiatement au démarrage
    this.nettoyerDevisExpires();
  }

  async nettoyerDevisExpires() {
    try {
      this.logger.log('Début du nettoyage des devis expirés...');
      
      await this.devisSauvegardeService.nettoyerDevisExpires();
      
      this.logger.log('Nettoyage des devis expirés terminé avec succès');
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des devis expirés:', error);
    }
  }

  async rapportDevisQuotidien() {
    try {
      this.logger.log('Génération du rapport quotidien des devis...');
      
      // Ici vous pourriez ajouter la logique pour générer des rapports
      // par exemple, envoyer un email aux administrateurs avec les statistiques
      
      this.logger.log('Rapport quotidien des devis généré avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de la génération du rapport quotidien:', error);
    }
  }

  onModuleDestroy() {
    if (this.nettoyageInterval) {
      clearInterval(this.nettoyageInterval);
    }
  }
}
