import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategorieToDevisAndMakeProductCategorieNullable1734270000000 implements MigrationInterface {
    name = 'AddCategorieToDevisAndMakeProductCategorieNullable1734270000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter categorie_id à devis_simules
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\`
            ADD COLUMN \`categorie_id\` VARCHAR(36) NULL
            COMMENT 'Catégorie du produit déterminée par les critères utilisateur'
            AFTER \`produit_id\`
        `);

        // 2. Ajouter la clé étrangère vers categories_produits
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\`
            ADD CONSTRAINT \`FK_devis_simules_categorie\`
            FOREIGN KEY (\`categorie_id\`) 
            REFERENCES \`categories_produits\`(\`id\`) 
            ON DELETE SET NULL 
            ON UPDATE CASCADE
        `);

        // 3. Rendre categorie_id nullable dans produits
        await queryRunner.query(`
            ALTER TABLE \`produits\`
            MODIFY COLUMN \`categorie_id\` VARCHAR(36) NULL
            COMMENT 'Catégorie principale du produit (optionnel)'
        `);

        console.log('✅ Migration terminée : categorie_id ajouté aux devis et rendu optionnel dans produits');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Supprimer la clé étrangère de devis_simules
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\`
            DROP FOREIGN KEY \`FK_devis_simules_categorie\`
        `);

        // 2. Supprimer la colonne categorie_id de devis_simules
        await queryRunner.query(`
            ALTER TABLE \`devis_simules\`
            DROP COLUMN \`categorie_id\`
        `);

        // 3. Remettre categorie_id NOT NULL dans produits
        await queryRunner.query(`
            ALTER TABLE \`produits\`
            MODIFY COLUMN \`categorie_id\` VARCHAR(36) NOT NULL
            COMMENT 'Catégorie du produit'
        `);

        console.log('⏪ Migration annulée : categorie_id retiré des devis et remis obligatoire dans produits');
    }
}
