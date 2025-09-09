import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyTarifSystemAndAddProductFields1700000000008 implements MigrationInterface {
    name = 'SimplifyTarifSystemAndAddProductFields1700000000008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        //  Ajouter les nouvelles colonnes à la table produits
        await queryRunner.query(`
            ALTER TABLE \`produits\` 
            ADD COLUMN \`necessite_beneficiaires\` BOOLEAN DEFAULT FALSE NOT NULL,
            ADD COLUMN \`max_beneficiaires\` INT DEFAULT 0 NOT NULL,
            ADD COLUMN \`periodicite_prime\` ENUM('mensuel', 'annuel') DEFAULT 'mensuel' NOT NULL
        `);

        // Vérifier si la colonne montant existe et la renommer vers montant_fixe
        const columns = await queryRunner.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'tarifs' 
            AND COLUMN_NAME IN ('montant', 'montant_fixe')
        `);
        
        const hasMontant = columns.some((col: any) => col.COLUMN_NAME === 'montant');
        const hasMontantFixe = columns.some((col: any) => col.COLUMN_NAME === 'montant_fixe');

        // Si montant existe mais pas montant_fixe, renommer
        if (hasMontant && !hasMontantFixe) {
            await queryRunner.query(`
                ALTER TABLE \`tarifs\` 
                CHANGE COLUMN \`montant\` \`montant_fixe\` DECIMAL(10,2) NOT NULL DEFAULT 0
            `);
        }
        // Si ni montant ni montant_fixe n'existent, créer montant_fixe
        else if (!hasMontant && !hasMontantFixe) {
            await queryRunner.query(`
                ALTER TABLE \`tarifs\` 
                ADD COLUMN \`montant_fixe\` DECIMAL(10,2) NOT NULL DEFAULT 0
            `);
        }

        // Supprimer les colonnes complexes si elles existent
        const complexColumns = await queryRunner.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'tarifs' 
            AND COLUMN_NAME IN ('pourcentage', 'formule')
        `);

        const hasPourcentage = complexColumns.some((col: any) => col.COLUMN_NAME === 'pourcentage');
        const hasFormule = complexColumns.some((col: any) => col.COLUMN_NAME === 'formule');

        if (hasPourcentage || hasFormule) {
            let dropQuery = 'ALTER TABLE `tarifs`';
            const dropColumns: string[] = [];
            
            if (hasPourcentage) dropColumns.push('DROP COLUMN `pourcentage`');
            if (hasFormule) dropColumns.push('DROP COLUMN `formule`');
            
            dropQuery += ' ' + dropColumns.join(', ');
            
            await queryRunner.query(dropQuery);
        }

        // Supprimer la table formules_calcul car elle ne sera plus utilisée
        await queryRunner.query(`DROP TABLE IF EXISTS \`formules_calcul\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Recréer la table formules_calcul
        await queryRunner.query(`
            CREATE TABLE \`formules_calcul\` (
                \`id\` varchar(36) NOT NULL,
                \`produit_id\` varchar(36) NOT NULL,
                \`nom\` varchar(255) NOT NULL,
                \`formule\` text NOT NULL,
                \`variables\` json NOT NULL,
                \`statut\` enum('actif', 'inactif') NOT NULL DEFAULT 'actif',
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                KEY \`FK_formules_calcul_produit\` (\`produit_id\`),
                CONSTRAINT \`FK_formules_calcul_produit\` FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\` (\`id\`) ON DELETE CASCADE
            )
        `);

        // 2. Restaurer les colonnes complexes dans tarifs
        // Vérifier si montant_fixe existe et la renommer vers montant
        const columns = await queryRunner.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'tarifs' 
            AND COLUMN_NAME IN ('montant', 'montant_fixe')
        `);
        
        const hasMontantFixe = columns.some((col: any) => col.COLUMN_NAME === 'montant_fixe');
        const hasMontant = columns.some((col: any) => col.COLUMN_NAME === 'montant');

        // Si montant_fixe existe mais pas montant, renommer
        if (hasMontantFixe && !hasMontant) {
            await queryRunner.query(`
                ALTER TABLE \`tarifs\` 
                CHANGE COLUMN \`montant_fixe\` \`montant\` DECIMAL(10,2) NULL
            `);
        }

        // Ajouter les colonnes complexes
        await queryRunner.query(`
            ALTER TABLE \`tarifs\` 
            ADD COLUMN \`pourcentage\` DECIMAL(5,2) NULL,
            ADD COLUMN \`formule\` TEXT NULL
        `);

        // 3. Supprimer les nouvelles colonnes de la table produits
        await queryRunner.query(`
            ALTER TABLE \`produits\` 
            DROP COLUMN \`necessite_beneficiaires\`,
            DROP COLUMN \`max_beneficiaires\`,
            DROP COLUMN \`periodicite_prime\`
        `);
    }
}
