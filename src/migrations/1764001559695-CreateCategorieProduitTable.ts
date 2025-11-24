import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategorieProduitTable1764001559695 implements MigrationInterface {
    name = 'CreateCategorieProduitTable1764001559695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop table if it exists to ensure clean state with correct collation
        await queryRunner.query(`DROP TABLE IF EXISTS \`categories_produits\``);

        // Check and drop foreign key if exists
        const fkExists = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
            WHERE CONSTRAINT_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produits' 
            AND CONSTRAINT_NAME = 'FK_ecb66b944bda31a8648741388d9'
        `);

        if (fkExists[0].count > 0) {
            await queryRunner.query(`ALTER TABLE \`produits\` DROP FOREIGN KEY \`FK_ecb66b944bda31a8648741388d9\``);
        }

        // Check and drop column if exists
        const colExists = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produits' 
            AND COLUMN_NAME = 'categorie_id'
        `);

        if (colExists[0].count > 0) {
            await queryRunner.query(`ALTER TABLE \`produits\` DROP COLUMN \`categorie_id\``);
        }

        // Create table with explicit collation to match other tables
        await queryRunner.query(`
            CREATE TABLE \`categories_produits\` (
                \`id\` varchar(36) NOT NULL, 
                \`code\` varchar(50) NOT NULL, 
                \`libelle\` varchar(255) NOT NULL, 
                \`description\` text NULL, 
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
                \`branche_id\` varchar(36) NOT NULL, 
                UNIQUE INDEX \`IDX_0ac41c22f163568c47a1632f61\` (\`code\`, \`branche_id\`), 
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Add column to produits
        await queryRunner.query(`ALTER TABLE \`produits\` ADD \`categorie_id\` varchar(36) NULL`);

        // Add FK to categories_produits (referencing branches_produits)
        await queryRunner.query(`
            ALTER TABLE \`categories_produits\` 
            ADD CONSTRAINT \`FK_7c8acd28364e3b9d9b5465c654c\` 
            FOREIGN KEY (\`branche_id\`) REFERENCES \`branches_produits\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add FK to produits (referencing categories_produits)
        await queryRunner.query(`
            ALTER TABLE \`produits\` 
            ADD CONSTRAINT \`FK_ecb66b944bda31a8648741388d9\` 
            FOREIGN KEY (\`categorie_id\`) REFERENCES \`categories_produits\`(\`id\`) 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`produits\` DROP FOREIGN KEY \`FK_ecb66b944bda31a8648741388d9\``);
        await queryRunner.query(`ALTER TABLE \`categories_produits\` DROP FOREIGN KEY \`FK_7c8acd28364e3b9d9b5465c654c\``);
        await queryRunner.query(`ALTER TABLE \`produits\` DROP COLUMN \`categorie_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_0ac41c22f163568c47a1632f61\` ON \`categories_produits\``);
        await queryRunner.query(`DROP TABLE \`categories_produits\``);
    }

}
