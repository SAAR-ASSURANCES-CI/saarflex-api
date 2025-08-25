import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDateExpirationToExpiresAt1700000000007 implements MigrationInterface {
  name = 'RenameDateExpirationToExpiresAt1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasDateExpiration = await queryRunner.hasColumn('devis_simules', 'date_expiration');
    
    if (hasDateExpiration) {
      const indexExists = await this.checkIndexExists(queryRunner, 'devis_simules', 'IDX_devis_date_expiration');
      
      if (indexExists) {
        await queryRunner.query(`
          DROP INDEX IDX_devis_date_expiration ON devis_simules
        `);
      }
      
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN date_expiration expires_at TIMESTAMP NULL
      `);
      
      await queryRunner.query(`
        CREATE INDEX IDX_devis_expires_at ON devis_simules (expires_at)
      `);
    }
    
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
    
    const hasGrilleTarifaireId = await queryRunner.hasColumn('devis_simules', 'grille_tarifaire_id');
    if (!hasGrilleTarifaireId) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        ADD COLUMN grille_tarifaire_id VARCHAR(36) NOT NULL
      `);
    }
    
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      MODIFY COLUMN statut ENUM('simulation', 'sauvegarde', 'expire') DEFAULT 'simulation'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexExists = await this.checkIndexExists(queryRunner, 'devis_simules', 'IDX_devis_expires_at');
    
    if (indexExists) {
      await queryRunner.query(`
        DROP INDEX IDX_devis_expires_at ON devis_simules
      `);
    }
    
    const hasExpiresAt = await queryRunner.hasColumn('devis_simules', 'expires_at');
    if (hasExpiresAt) {
      await queryRunner.query(`
        ALTER TABLE devis_simules 
        CHANGE COLUMN expires_at date_expiration TIMESTAMP NULL
      `);
      
      await queryRunner.query(`
        CREATE INDEX IDX_devis_date_expiration ON devis_simules (date_expiration)
      `);
    }
    
    const hasNomPersonnalise = await queryRunner.hasColumn('devis_simules', 'nom_personnalise');
    if (hasNomPersonnalise) {
      await queryRunner.query(`
        ALTER TABLE devis_simules DROP COLUMN nom_personnalise
      `);
    }
    
    const hasNotes = await queryRunner.hasColumn('devis_simules', 'notes');
    if (hasNotes) {
      await queryRunner.query(`
        ALTER TABLE devis_simules DROP COLUMN notes
      `);
    }
    
    const hasFranchiseCalculee = await queryRunner.hasColumn('devis_simules', 'franchise_calculee');
    if (hasFranchiseCalculee) {
      await queryRunner.query(`
        ALTER TABLE devis_simules DROP COLUMN franchise_calculee
      `);
    }
    
    const hasPlafondCalcule = await queryRunner.hasColumn('devis_simules', 'plafond_calcule');
    if (hasPlafondCalcule) {
      await queryRunner.query(`
        ALTER TABLE devis_simules DROP COLUMN plafond_calcule
      `);
    }
    
    const hasGrilleTarifaireId = await queryRunner.hasColumn('devis_simules', 'grille_tarifaire_id');
    if (hasGrilleTarifaireId) {
      await queryRunner.query(`
        ALTER TABLE devis_simules DROP COLUMN grille_tarifaire_id
      `);
    }
    
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
    
    await queryRunner.query(`
      ALTER TABLE devis_simules 
      MODIFY COLUMN statut ENUM('brouillon','envoye','accepte','refuse') DEFAULT 'brouillon'
    `);
  }

  /**
   * Vérifier si un index existe
   */
  private async checkIndexExists(queryRunner: QueryRunner, tableName: string, indexName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = '${tableName}' 
      AND INDEX_NAME = '${indexName}'
    `);
    
    return result[0].count > 0;
  }
}