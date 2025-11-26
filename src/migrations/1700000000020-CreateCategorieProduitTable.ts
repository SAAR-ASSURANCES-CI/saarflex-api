import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategorieProduitTable1700000000020 implements MigrationInterface {
    name = 'CreateCategorieProduitTable1700000000020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'categories_produits'
        `);

        if (tableExists[0].count > 0) {
            console.log('⚠️  Table categories_produits existe déjà, migration ignorée');
            return;
        }

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

        await queryRunner.query(`ALTER TABLE \`produits\` ADD \`categorie_id\` varchar(36) NULL`);

        await queryRunner.query(`
            ALTER TABLE \`categories_produits\` 
            ADD CONSTRAINT \`FK_7c8acd28364e3b9d9b5465c654c\` 
            FOREIGN KEY (\`branche_id\`) REFERENCES \`branches_produits\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

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
