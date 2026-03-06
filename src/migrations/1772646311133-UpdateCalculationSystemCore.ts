import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCalculationSystemCore1772646311133 implements MigrationInterface {
    name = 'UpdateCalculationSystemCore1772646311133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`grilles_tarifaires\` ADD \`variables_techniques\` json NULL COMMENT 'Variables techniques propres à la grille (ex: { "i": 0.035, "m": 12 })'`);
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` ADD \`code\` varchar(50) NULL COMMENT 'Code technique pour utilisation dans les formules (ex: capital, n, m)'`);
        await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` CHANGE \`valeur\` \`valeur\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` CHANGE \`valeur\` \`valeur\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`criteres_tarification\` DROP COLUMN \`code\``);
        await queryRunner.query(`ALTER TABLE \`grilles_tarifaires\` DROP COLUMN \`variables_techniques\``);
    }
}
