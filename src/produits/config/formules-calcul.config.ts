export interface FormuleCalculConfig {
  nom: string;
  formule: string;
  variables: Record<string, any>;
  description: string;
}

export const FORMULES_CALCUL_DEFAUT: Record<string, FormuleCalculConfig> = {
  // Formule pour l'assurance vie
  assurance_vie: {
    nom: 'Formule Standard Assurance Vie',
    formule: 'prime_base * (1 + (age - 25) * 0.02) * (montant_assurance / 10000) * coef_profession',
    variables: {
      prime_base: 50,
      coef_profession: {
        'employé': 1.0,
        'cadre': 1.1,
        'dirigeant': 1.2,
        'retraité': 1.3
      }
    },
    description: 'Calcul de prime basé sur l\'âge, le montant assuré et la profession'
  },

  // Formule pour l'assurance auto
  assurance_auto: {
    nom: 'Formule Standard Assurance Auto',
    formule: 'prime_base * coef_age * coef_zone * coef_vehicule * (1 + bonus_malus)',
    variables: {
      prime_base: 300,
      coef_age: {
        '18-25': 1.5,
        '26-35': 1.2,
        '36-50': 1.0,
        '51-65': 1.1,
        '65+': 1.3
      },
      coef_zone: {
        'zone1': 1.0,
        'zone2': 1.1,
        'zone3': 1.2,
        'zone4': 1.3
      },
      coef_vehicule: {
        'citadine': 0.9,
        'berline': 1.0,
        'suv': 1.1,
        'sport': 1.3
      }
    },
    description: 'Calcul de prime basé sur l\'âge du conducteur, la zone géographique et le type de véhicule'
  },

  // Formule pour l'assurance santé
  assurance_sante: {
    nom: 'Formule Standard Assurance Santé',
    formule: 'prime_base * coef_age * coef_couverture * (1 + coef_antecedents)',
    variables: {
      prime_base: 80,
      coef_age: {
        '18-30': 0.8,
        '31-45': 1.0,
        '46-60': 1.2,
        '61-75': 1.5,
        '75+': 2.0
      },
      coef_couverture: {
        'basique': 0.7,
        'standard': 1.0,
        'premium': 1.3,
        'excellence': 1.6
      },
      coef_antecedents: {
        'aucun': 0.0,
        'faible': 0.1,
        'modéré': 0.2,
        'élevé': 0.4
      }
    },
    description: 'Calcul de prime basé sur l\'âge, le niveau de couverture et les antécédents médicaux'
  },

  // Formule pour l'assurance habitation
  assurance_habitation: {
    nom: 'Formule Standard Assurance Habitation',
    formule: 'prime_base * coef_surface * coef_zone * coef_construction * coef_garanties',
    variables: {
      prime_base: 120,
      coef_surface: {
        '0-50m2': 0.8,
        '51-100m2': 1.0,
        '101-150m2': 1.2,
        '150m2+': 1.4
      },
      coef_zone: {
        'rurale': 0.9,
        'urbaine': 1.0,
        'périurbaine': 1.1
      },
      coef_construction: {
        'avant_1950': 1.2,
        '1950_1980': 1.1,
        '1980_2000': 1.0,
        '2000_2010': 0.95,
        'apres_2010': 0.9
      }
    },
    description: 'Calcul de prime basé sur la surface, la zone et l\'année de construction'
  }
};

export const FRANCHISES_DEFAUT: Record<string, number> = {
  assurance_vie: 0, // Pas de franchise pour l'assurance vie
  assurance_auto: 300,
  assurance_sante: 50,
  assurance_habitation: 200
};

export const PLAFONDS_DEFAUT: Record<string, number> = {
  assurance_vie: 1.5, // Multiplicateur du montant assuré
  assurance_auto: 1.2,
  assurance_sante: 1.0, // Pas de plafond pour la santé
  assurance_habitation: 1.3
};

export const DUREE_VALIDITE_SIMULATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
