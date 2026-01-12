import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompositeIndexToContrats1768191393505 implements MigrationInterface {
    name = 'AddCompositeIndexToContrats1768191393505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Supprimer l'index unique existant s'il existe
        try {
            await queryRunner.query(`DROP INDEX \`IDX_5aee353fdcd3cd24a90d019d0e\` ON \`contrats\``);
            console.log("Ancien index IDX_5aee353fdcd3cd24a90d019d0e supprimé.");
        } catch (e) {
            console.log("L'index IDX_5aee353fdcd3cd24a90d019d0e n'existait pas.");
        }

        // 2. Ajouter la colonne type_produit si elle n'existe pas
        try {
            await queryRunner.query(`ALTER TABLE \`contrats\` ADD \`type_produit\` enum ('vie', 'non-vie') NOT NULL DEFAULT 'non-vie'`);
            console.log("Colonne type_produit ajoutée.");
        } catch (e) {
            console.log("La colonne type_produit existe déjà.");
        }

        // 3. Créer le nouvel index composite s'il n'existe pas
        try {
            await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_dc1f1686bd684472d84989b309\` ON \`contrats\` (\`numero_contrat\`, \`type_produit\`)`);
            console.log("Nouvel index composite IDX_dc1f1686bd684472d84989b309 créé.");
        } catch (e) {
            console.log("Le nouvel index existe déjà.");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_dc1f1686bd684472d84989b309\` ON \`contrats\``);
        await queryRunner.query(`ALTER TABLE \`contrats\` DROP COLUMN \`type_produit\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_5aee353fdcd3cd24a90d019d0e\` ON \`contrats\` (\`numero_contrat\`)`);
    }

}
