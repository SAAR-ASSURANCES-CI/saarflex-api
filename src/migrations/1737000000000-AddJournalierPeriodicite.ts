import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJournalierPeriodicite1737000000000 implements MigrationInterface {
  name = 'AddJournalierPeriodicite1737000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`produits\`
      MODIFY \`periodicite_prime\` ENUM('journalier', 'mensuel', 'annuel') NOT NULL DEFAULT 'mensuel'
    `);

    await queryRunner.query(`
      ALTER TABLE \`contrats\`
      MODIFY \`periodicite_paiement\` ENUM('journalier', 'mensuel', 'annuel') NOT NULL DEFAULT 'mensuel'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contrats\`
      MODIFY \`periodicite_paiement\` ENUM('mensuel', 'annuel') NOT NULL DEFAULT 'mensuel'
    `);

    await queryRunner.query(`
      ALTER TABLE \`produits\`
      MODIFY \`periodicite_prime\` ENUM('mensuel', 'annuel') NOT NULL DEFAULT 'mensuel'
    `);
  }
}

