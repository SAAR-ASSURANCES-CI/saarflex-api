import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfilesTable1754667171902 implements MigrationInterface {
  name = 'CreateProfilesTable1754667171902';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`profiles\` (
      \`id\` varchar(36) NOT NULL,
      \`user_id\` varchar(36) NOT NULL,
      \`lieu_naissance\` varchar(255) NULL,
      \`sexe\` varchar(20) NULL,
      \`nationalite\` varchar(100) NULL,
      \`profession\` varchar(100) NULL,
      \`adresse\` varchar(255) NULL,
      \`numero_piece_identite\` varchar(100) NULL,
      \`type_piece_identite\` varchar(50) NULL,
      \`date_creation\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`date_modification\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      UNIQUE INDEX \`IDX_profiles_user_unique\` (\`user_id\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`);

    await queryRunner.query(`ALTER TABLE \`profiles\` ADD CONSTRAINT \`FK_profiles_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profiles\` DROP FOREIGN KEY \`FK_profiles_user\``);
    await queryRunner.query(`DROP INDEX \`IDX_profiles_user_unique\` ON \`profiles\``);
    await queryRunner.query(`DROP TABLE \`profiles\``);
  }
}


