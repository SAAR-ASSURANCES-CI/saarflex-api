import { SimulationDevisService } from '../public/services/simulation-devis.service';

// Test simple de la logique de calcul (sans dépendances externes)
describe('SimulationDevisService - Logique de calcul', () => {
  let service: SimulationDevisService;

  beforeEach(() => {
    // Mock des dépendances pour les tests
    service = new SimulationDevisService(
      {} as any, // devisSimuleRepository
      {} as any, // produitRepository
      {} as any, // grilleTarifaireRepository
      {} as any, // formuleCalculRepository
      {} as any, // tarifRepository
      {} as any, // critereTarificationRepository
      {} as any  // valeurCritereRepository
    );
  });

  describe('Calcul des coefficients par défaut', () => {
    it('devrait appliquer le bon coefficient d\'âge', () => {
      const variables: Record<string, any> = { age: 22 };
      service['appliquerCoefficientsDefaut'](variables);
      
      expect(variables.coef_age).toBe(1.2);
    });

    it('devrait appliquer le bon coefficient de profession', () => {
      const variables: Record<string, any> = { profession: 'cadre' };
      service['appliquerCoefficientsDefaut'](variables);
      
      expect(variables.coef_profession).toBe(1.1);
    });

    it('devrait appliquer le bon coefficient de zone', () => {
      const variables: Record<string, any> = { zone_geographique: 'zone3' };
      service['appliquerCoefficientsDefaut'](variables);
      
      expect(variables.coef_zone).toBe(1.2);
    });
  });

  describe('Détermination du type d\'assurance', () => {
    it('devrait identifier une assurance vie', () => {
      const result = service['determinerTypeAssurance']('Assurance Vie Premium', 'vie');
      expect(result).toBe('assurance_vie');
    });

    it('devrait identifier une assurance auto', () => {
      const result = service['determinerTypeAssurance']('Assurance Véhicule', 'non-vie');
      expect(result).toBe('assurance_auto');
    });

    it('devrait identifier une assurance santé', () => {
      const result = service['determinerTypeAssurance']('Assurance Médicale', 'non-vie');
      expect(result).toBe('assurance_sante');
    });
  });

  describe('Calcul de franchise personnalisée', () => {
    it('devrait retourner 0 pour l\'assurance vie', () => {
      const result = service['calculerFranchisePersonnalisee']({}, 'vie');
      expect(result).toBe(0);
    });

    it('devrait calculer la franchise selon le montant assuré', () => {
      const variables = { montant_assurance: 10000 };
      const result = service['calculerFranchisePersonnalisee'](variables, 'non-vie');
      expect(result).toBe(500); // 5% avec max 500€
    });
  });

  describe('Calcul de plafond personnalisé', () => {
    it('devrait calculer le plafond pour l\'assurance vie', () => {
      const variables = { montant_assurance: 50000 };
      const result = service['calculerPlafondPersonnalisee'](variables, 'vie');
      expect(result).toBe(75000); // 50000 * 1.5
    });

    it('devrait calculer le plafond pour l\'assurance non-vie', () => {
      const variables = { montant_assurance: 30000 };
      const result = service['calculerPlafondPersonnalisee'](variables, 'non-vie');
      expect(result).toBe(36000); // 30000 * 1.2
    });
  });

  describe('Formule de fallback', () => {
    it('devrait calculer la prime de base', () => {
      const variables = { prime_base: 100 };
      const result = service['calculerPrimeFallback'](variables);
      expect(result).toBe(100);
    });

    it('devrait appliquer les coefficients', () => {
      const variables = { 
        prime_base: 100, 
        coef_age: 1.2, 
        coef_profession: 1.1 
      };
      const result = service['calculerPrimeFallback'](variables);
      expect(result).toBe(132); // 100 * 1.2 * 1.1
    });
  });

  describe('Génération d\'explication', () => {
    it('devrait générer une explication complète', () => {
      const variables = { 
        age: 30, 
        profession: 'employe', 
        montant_assurance: 50000,
        zone_geographique: 'zone1'
      };
      const result = service['genererExplicationCalcul'](variables, 125.50, 25.10);
      
      expect(result).toContain('Age: 30 ans');
      expect(result).toContain('Profession: employe');
      expect(result).toContain('Montant assure: 50000€');
      expect(result).toContain('Zone: zone1');
      expect(result).toContain('Prime calculee: 125.5€');
      expect(result).toContain('Franchise: 25.1€');
    });
  });
});
