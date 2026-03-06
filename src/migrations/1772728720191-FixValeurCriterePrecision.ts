import { MigrationInterface, QueryRunner } from "typeorm";

export class FixValeurCriterePrecision1772728720191 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` CHANGE \`valeur_min\` \`valeur_min\` decimal(20,8) NULL`);
        await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` CHANGE \`valeur_max\` \`valeur_max\` decimal(20,8) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` CHANGE \`valeur_min\` \`valeur_min\` decimal(20,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`valeurs_criteres\` CHANGE \`valeur_max\` \`valeur_max\` decimal(20,2) NULL`);
    }
}
