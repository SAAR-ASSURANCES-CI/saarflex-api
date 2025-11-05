import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyPaiementsTableForCinetPay1700000000017 implements MigrationInterface {
  name = 'ModifyPaiementsTableForCinetPay1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`paiements\`
      ADD COLUMN \`payment_token\` varchar(255) NULL AFTER \`date_paiement\`,
      ADD COLUMN \`payment_url\` varchar(500) NULL AFTER \`payment_token\`,
      ADD COLUMN \`currency\` varchar(3) NULL AFTER \`payment_url\`,
      ADD COLUMN \`cinetpay_transaction_id\` varchar(100) NULL AFTER \`currency\`,
      ADD COLUMN \`operator_id\` varchar(50) NULL AFTER \`cinetpay_transaction_id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`paiements\`
      MODIFY COLUMN \`methode_paiement\` enum('mobile_money','wallet') NOT NULL
    `);

    await queryRunner.query(`
      UPDATE \`paiements\`
      SET \`methode_paiement\` = 'mobile_money'
      WHERE \`methode_paiement\` IN ('wave', 'orange_money')
    `);

    await queryRunner.query(`
      UPDATE \`paiements\`
      SET \`methode_paiement\` = 'mobile_money'
      WHERE \`methode_paiement\` NOT IN ('mobile_money', 'wallet')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurer l'ancien enum
    await queryRunner.query(`
      ALTER TABLE \`paiements\`
      MODIFY COLUMN \`methode_paiement\` enum('wave','orange_money','carte_bancaire','virement','especes') NOT NULL
    `);

    // Supprimer les colonnes ajoutées
    await queryRunner.query(`
      ALTER TABLE \`paiements\`
      DROP COLUMN \`operator_id\`,
      DROP COLUMN \`cinetpay_transaction_id\`,
      DROP COLUMN \`currency\`,
      DROP COLUMN \`payment_url\`,
      DROP COLUMN \`payment_token\`
    `);
  }
}

