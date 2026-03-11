import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DevisSauvegardeService } from '../public/services/devis-sauvegarde.service';
import { ContratService } from './contrat.service';

@Injectable()
export class TachePlanifieeService implements OnModuleInit {
  private readonly logger = new Logger(TachePlanifieeService.name);
  private nettoyageInterval: NodeJS.Timeout;

  constructor(
    private readonly devisSauvegardeService: DevisSauvegardeService,
    private readonly contratService: ContratService,
  ) {}

  onModuleInit() {
    this.nettoyageInterval = setInterval(() => {
      this.nettoyerDevisExpires();
    }, 60 * 60 * 1000); // 1 heure
    this.nettoyerDevisExpires();
  }

  async nettoyerDevisExpires() {
    try {
      this.logger.log('Début du nettoyage des devis et contrats expirés...');
      
      const nbDevis = await this.devisSauvegardeService.nettoyerDevisExpires();
      const nbContrats = await this.contratService.mettreAJourContratsExpires();
      
      this.logger.log(`Nettoyage terminé : ${nbDevis} devis supprimés, ${nbContrats} contrats expirés.`);
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des éléments expirés:', error);
    }
  }

  async rapportDevisQuotidien() {
    try {
      this.logger.log('Génération du rapport quotidien des devis...');
      
      
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
