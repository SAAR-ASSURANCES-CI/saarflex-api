import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCheminContratFinalToContrat1735655924001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("contrats");
        const hasColumn = table?.findColumnByName("chemin_contrat_final");

        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE \`contrats\` ADD \`chemin_contrat_final\` varchar(500) NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("contrats");
        const hasColumn = table?.findColumnByName("chemin_contrat_final");

        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE \`contrats\` DROP COLUMN \`chemin_contrat_final\``);
        }
    }
}
