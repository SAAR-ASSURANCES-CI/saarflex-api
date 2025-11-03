import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPremiereConnexionAndMotDePasseTemporaireToUsers1700000000016 implements MigrationInterface {
  name = 'AddPremiereConnexionAndMotDePasseTemporaireToUsers1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`premiere_connexion\` tinyint NOT NULL DEFAULT 1`);
    
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`mot_de_passe_temporaire\` tinyint NOT NULL DEFAULT 0`);
    
    await queryRunner.query(`UPDATE \`users\` SET \`premiere_connexion\` = 0, \`mot_de_passe_temporaire\` = 0 WHERE \`date_creation\` < NOW()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`mot_de_passe_temporaire\``);
    
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`premiere_connexion\``);
  }
}

