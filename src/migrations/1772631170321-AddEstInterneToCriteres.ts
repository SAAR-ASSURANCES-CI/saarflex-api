import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEstInterneToCriteres1772631170321 implements MigrationInterface {
    name = 'AddEstInterneToCriteres1772631170321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` ADD \`est_interne\` tinyint NOT NULL COMMENT 'Définit si le critère est une constante interne (taux, frais) non visible par l''utilisateur' DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` DROP COLUMN \`est_interne\``);
    }

}
