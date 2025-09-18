import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCriteresCombinesToTarifs1700000000010 implements MigrationInterface {
    name = 'AddCriteresCombinesToTarifs1700000000010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne criteres_combines à la table tarifs
        await queryRunner.query(`
            ALTER TABLE \`tarifs\` 
            ADD COLUMN \`criteres_combines\` JSON NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la colonne criteres_combines
        await queryRunner.query(`
            ALTER TABLE \`tarifs\` 
            DROP COLUMN \`criteres_combines\`
        `);
    }
}
