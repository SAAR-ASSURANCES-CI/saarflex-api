import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeCalculToTarifs1734811500000 implements MigrationInterface {
    name = 'AddTypeCalculToTarifs1734811500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter la colonne type_calcul
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            ADD COLUMN \`type_calcul\` enum('montant_fixe','pourcentage_valeur_neuve','pourcentage_valeur_venale','formule_personnalisee') 
            NOT NULL DEFAULT 'montant_fixe' 
            COMMENT 'Type de calcul du tarif'
            AFTER \`grille_id\`
        `);

        // 2. Ajouter la colonne taux_pourcentage
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            ADD COLUMN \`taux_pourcentage\` decimal(5,2) NULL 
            COMMENT 'Taux de pourcentage pour calcul sur VN ou VV (ex: 3.5 pour 3.5%)'
            AFTER \`type_calcul\`
        `);

        // 3. Ajouter la colonne formule_calcul
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            ADD COLUMN \`formule_calcul\` text NULL 
            COMMENT 'Formule de calcul personnalisée (ex: montant_base + (valeur_neuve * 0.01))'
            AFTER \`taux_pourcentage\`
        `);

        // 4. Rendre montant_fixe nullable (car optionnel selon le type de calcul)
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            MODIFY COLUMN \`montant_fixe\` decimal(15,2) NULL 
            COMMENT 'Montant fixe en FCFA (utilisé si type_calcul = montant_fixe)'
        `);

        console.log('✅ Colonnes type_calcul, taux_pourcentage et formule_calcul ajoutées à la table tarifs');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Supprimer la colonne formule_calcul
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            DROP COLUMN \`formule_calcul\`
        `);

        // 2. Supprimer la colonne taux_pourcentage
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            DROP COLUMN \`taux_pourcentage\`
        `);

        // 3. Supprimer la colonne type_calcul
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            DROP COLUMN \`type_calcul\`
        `);

        // 4. Remettre montant_fixe NOT NULL
        await queryRunner.query(`
            ALTER TABLE \`tarifs\`
            MODIFY COLUMN \`montant_fixe\` decimal(15,2) NOT NULL 
            COMMENT 'Montant fixe en FCFA'
        `);

        console.log('⏪ Colonnes type_calcul, taux_pourcentage et formule_calcul supprimées de la table tarifs');
    }
}
