import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDateExpirationToExpiresAt1700000000007 implements MigrationInterface {
  name = 'RenameDateExpirationToExpiresAt1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne date_expiration existe
    const hasDateExpiration = await queryRunner.hasColumn('devis_simules', 'date_expiration');
    
    if (hasDateExpiration) {
      // Supprimer l'ancien index sur date_expiration
      await queryRunner.query(`
        DROP INDEX IF EXISTS IDX_devis_date_expiration ON devis_simules
      `);
      
      // Renommer la colonne date_expiration en expires_at
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN date_expiration expires_at TIMESTAMP NULL
      `);
      
      // Recréer l'index avec le nouveau nom
      await queryRunner.query(`
        CREATE INDEX IDX_devis_expires_at ON devis_simules (expires_at)
      `);
    }
    
    // Vérifier et ajouter les colonnes manquantes selon notre entité actuelle
    const hasNomPersonnalise = await queryRunner.hasColumn('devis_simules', 'nom_personnalise');
    if (!hasNomPersonnalise) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        ADD COLUMN nom_personnalise VARCHAR(255) NULL
      `);
    }
    
    const hasNotes = await queryRunner.hasColumn('devis_simules', 'notes');
    if (!hasNotes) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        ADD COLUMN notes TEXT NULL
      `);
    }
    
    // Vérifier et renommer les colonnes si nécessaire
    const hasUserId = await queryRunner.hasColumn('devis_simules', 'user_id');
    const hasUtilisateurId = await queryRunner.hasColumn('devis_simules', 'utilisateur_id');
    
    if (hasUserId && !hasUtilisateurId) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN user_id utilisateur_id VARCHAR(36) NULL
      `);
    }
    
    const hasCriteres = await queryRunner.hasColumn('devis_simules', 'criteres');
    const hasCriteresUtilisateur = await queryRunner.hasColumn('devis_simules', 'criteres_utilisateur');
    
    if (hasCriteres && !hasCriteresUtilisateur) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN criteres criteres_utilisateur JSON NULL
      `);
    }
    
    const hasMontantCalcul = await queryRunner.hasColumn('devis_simules', 'montant_calcul');
    const hasPrimeCalculee = await queryRunner.hasColumn('devis_simules', 'prime_calculee');
    
    if (hasMontantCalcul && !hasPrimeCalculee) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN montant_calcul prime_calculee DECIMAL(10,2) NOT NULL
      `);
    }
    
    // Ajouter les colonnes manquantes pour la franchise et le plafond
    const hasFranchiseCalculee = await queryRunner.hasColumn('devis_simules', 'franchise_calculee');
    if (!hasFranchiseCalculee) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        ADD COLUMN franchise_calculee DECIMAL(10,2) DEFAULT 0
      `);
    }
    
    const hasPlafondCalcule = await queryRunner.hasColumn('devis_simules', 'plafond_calcule');
    if (!hasPlafondCalcule) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        ADD COLUMN plafond_calcule DECIMAL(10,2) NULL
      `);
    }
    
    // Ajouter la colonne grille_tarifaire_id si elle n'existe pas
    const hasGrilleTarifaireId = await queryRunner.hasColumn('devis_simules', 'grille_tarifaire_id');
    if (!hasGrilleTarifaireId) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        ADD COLUMN grille_tarifaire_id VARCHAR(36) NOT NULL
      `);
    }
    
    // Mettre à jour l'index sur le statut pour inclure les nouvelles valeurs
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      MODIFY COLUMN statut ENUM('simulation', 'sauvegarde', 'expire') DEFAULT 'simulation'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurer la structure originale
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_devis_expires_at ON devis_simules
    `);
    
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      CHANGE COLUMN expires_at date_expiration TIMESTAMP NULL
    `);
    
    await queryRunner.query(`
      CREATE INDEX IDX_devis_date_expiration ON devis_simules (date_expiration)
    `);
    
    // Supprimer les colonnes ajoutées
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      DROP COLUMN IF EXISTS nom_personnalise,
      DROP COLUMN IF EXISTS notes,
      DROP COLUMN IF EXISTS franchise_calculee,
      DROP COLUMN IF EXISTS plafond_calcule,
      DROP COLUMN IF EXISTS grille_tarifaire_id
    `);
    
    // Restaurer les noms de colonnes originaux
    const hasUtilisateurId = await queryRunner.hasColumn('devis_simules', 'utilisateur_id');
    if (hasUtilisateurId) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN utilisateur_id user_id VARCHAR(36) NULL
      `);
    }
    
    const hasCriteresUtilisateur = await queryRunner.hasColumn('devis_simules', 'criteres_utilisateur');
    if (hasCriteresUtilisateur) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN criteres_utilisateur criteres JSON NULL
      `);
    }
    
    const hasPrimeCalculee = await queryRunner.hasColumn('devis_simules', 'prime_calculee');
    if (hasPrimeCalculee) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN prime_calculee montant_calcul DECIMAL(10,2) NULL
      `);
    }
    
    // Restaurer l'ancien enum de statut
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      MODIFY COLUMN statut ENUM('brouillon','envoye','accepte','refuse') DEFAULT 'brouillon'
    `);
  }
}
