import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedContratsForNumeroPoliceTest1732620000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🚀 Début du seeding pour test numéro de police...\n');

        // 1. Code agence
        console.log('📝 Configuration du code agence...');
        const existingConfig = await queryRunner.query(`SELECT * FROM \`configuration_systeme\` WHERE \`cle\` = 'code_agence'`);
        if (existingConfig.length === 0) {
            await queryRunner.query(`INSERT INTO \`configuration_systeme\` (\`id\`, \`cle\`, \`valeur\`, \`description\`) VALUES (UUID(), 'code_agence', '101', 'Code agence')`);
        } else {
            await queryRunner.query(`UPDATE \`configuration_systeme\` SET \`valeur\` = '101' WHERE \`cle\` = 'code_agence'`);
        }
        console.log('   ✅ Code agence: 101\n');

        // 2. Utilisateur
        console.log('👤 Utilisateur...');
        const userResult = await queryRunner.query(`SELECT UUID() as id`);
        const userId = userResult[0].id;
        await queryRunner.query(`INSERT INTO \`users\` (\`id\`, \`email\`, \`nom\`, \`type_utilisateur\`, \`statut\`, \`mot_de_passe\`) VALUES ('${userId}', 'test.police@example.com', 'Test Police', 'client', true, '$2b$10$test')`);
        console.log('   ✅ Utilisateur créé\n');

        // 3. Branches
        console.log('🌿 Branches...');
        const brVie = await queryRunner.query(`SELECT UUID() as id`);
        const brNonVie = await queryRunner.query(`SELECT UUID() as id`);
        const brVieId = brVie[0].id;
        const brNonVieId = brNonVie[0].id;
        await queryRunner.query(`INSERT INTO \`branches_produits\` (\`id\`, \`nom\`, \`type\`, \`description\`, \`ordre\`) VALUES ('${brVieId}', 'Vie Test', 'vie', 'Test', 1), ('${brNonVieId}', 'Non-Vie Test', 'non-vie', 'Test', 2)`);
        console.log('   ✅ 2 branches\n');

        // 4. Catégories
        console.log('📂 Catégories...');
        const cv1 = await queryRunner.query(`SELECT UUID() as id`);
        const cv2 = await queryRunner.query(`SELECT UUID() as id`);
        const cnv1 = await queryRunner.query(`SELECT UUID() as id`);
        const cnv2 = await queryRunner.query(`SELECT UUID() as id`);
        const cv1Id = cv1[0].id, cv2Id = cv2[0].id, cnv1Id = cnv1[0].id, cnv2Id = cnv2[0].id;
        await queryRunner.query(`INSERT INTO \`categories_produits\` (\`id\`, \`code\`, \`libelle\`, \`description\`, \`branche_id\`) VALUES ('${cv1Id}', '230', 'Épargne', 'Test', '${brVieId}'), ('${cv2Id}', '240', 'Prévoyance', 'Test', '${brVieId}'), ('${cnv1Id}', '150', 'Auto', 'Test', '${brNonVieId}'), ('${cnv2Id}', '160', 'Habitation', 'Test', '${brNonVieId}')`);
        console.log('   ✅ 4 catégories\n');

        // 5. Produits
        console.log('🛡️  Produits...');
        const pv1 = await queryRunner.query(`SELECT UUID() as id`);
        const pv2 = await queryRunner.query(`SELECT UUID() as id`);
        const pnv1 = await queryRunner.query(`SELECT UUID() as id`);
        const pnv2 = await queryRunner.query(`SELECT UUID() as id`);
        const pv1Id = pv1[0].id, pv2Id = pv2[0].id, pnv1Id = pnv1[0].id, pnv2Id = pnv2[0].id;
        await queryRunner.query(`INSERT INTO \`produits\` (\`id\`, \`nom\`, \`description\`, \`type\`, \`branch_id\`, \`categorie_id\`, \`periodicite_prime\`, \`statut\`, \`created_by\`) VALUES ('${pv1Id}', 'Épargne Test', 'Test', 'vie', '${brVieId}', '${cv1Id}', 'mensuel', 'actif', '${userId}'), ('${pv2Id}', 'Prévoyance Test', 'Test', 'vie', '${brVieId}', '${cv2Id}', 'mensuel', 'actif', '${userId}'), ('${pnv1Id}', 'Auto Test', 'Test', 'non-vie', '${brNonVieId}', '${cnv1Id}', 'annuel', 'actif', '${userId}'), ('${pnv2Id}', 'Habitation Test', 'Test', 'non-vie', '${brNonVieId}', '${cnv2Id}', 'annuel', 'actif', '${userId}')`);
        console.log('   ✅ 4 produits\n');

        // 6. Grilles
        console.log('💰 Grilles...');
        const gv1 = await queryRunner.query(`SELECT UUID() as id`);
        const gv2 = await queryRunner.query(`SELECT UUID() as id`);
        const gnv1 = await queryRunner.query(`SELECT UUID() as id`);
        const gnv2 = await queryRunner.query(`SELECT UUID() as id`);
        const gv1Id = gv1[0].id, gv2Id = gv2[0].id, gnv1Id = gnv1[0].id, gnv2Id = gnv2[0].id;
        await queryRunner.query(`INSERT INTO \`grilles_tarifaires\` (\`id\`, \`nom\`, \`produit_id\`, \`date_debut\`, \`date_fin\`, \`statut\`, \`created_by\`) VALUES ('${gv1Id}', 'Grille Test 1', '${pv1Id}', '2025-01-01', '2025-12-31', 'actif', '${userId}'), ('${gv2Id}', 'Grille Test 2', '${pv2Id}', '2025-01-01', '2025-12-31', 'actif', '${userId}'), ('${gnv1Id}', 'Grille Test 3', '${pnv1Id}', '2025-01-01', '2025-12-31', 'actif', '${userId}'), ('${gnv2Id}', 'Grille Test 4', '${pnv2Id}', '2025-01-01', '2025-12-31', 'actif', '${userId}')`);
        console.log('   ✅ 4 grilles\n');

        // 7. Devis
        console.log('📋 Devis...');
        const devis = [
            { p: pv1Id, g: gv1Id, t: 'VIE', c: '230', n: 1, pr: 50000 },
            { p: pv1Id, g: gv1Id, t: 'VIE', c: '230', n: 2, pr: 55000 },
            { p: pv1Id, g: gv1Id, t: 'VIE', c: '230', n: 3, pr: 60000 },
            { p: pv2Id, g: gv2Id, t: 'VIE', c: '240', n: 1, pr: 45000 },
            { p: pv2Id, g: gv2Id, t: 'VIE', c: '240', n: 2, pr: 48000 },
            { p: pnv1Id, g: gnv1Id, t: 'NONVIE', c: '150', n: 1, pr: 120000 },
            { p: pnv1Id, g: gnv1Id, t: 'NONVIE', c: '150', n: 2, pr: 125000 },
            { p: pnv1Id, g: gnv1Id, t: 'NONVIE', c: '150', n: 3, pr: 130000 },
            { p: pnv2Id, g: gnv2Id, t: 'NONVIE', c: '160', n: 1, pr: 80000 },
            { p: pnv2Id, g: gnv2Id, t: 'NONVIE', c: '160', n: 2, pr: 85000 }
        ];
        for (const d of devis) {
            const did = (await queryRunner.query(`SELECT UUID() as id`))[0].id;
            await queryRunner.query(`INSERT INTO \`devis_simules\` (\`id\`, \`produit_id\`, \`grille_tarifaire_id\`, \`utilisateur_id\`, \`criteres_utilisateur\`, \`prime_calculee\`, \`franchise_calculee\`, \`plafond_calcule\`, \`statut\`, \`reference\`, \`informations_assure\`, \`assure_est_souscripteur\`) VALUES ('${did}', '${d.p}', '${d.g}', '${userId}', '{}', ${d.pr}, ${d.pr * 0.1}, ${d.pr * 20}, 'paye', 'DEV-${d.t}-${d.c}-${String(d.n).padStart(3, '0')}', '{"nom":"Test ${d.t}"}', true)`);
        }
        console.log(`   ✅ ${devis.length} devis\n`);
        console.log('✅ TERMINÉ - Exécutez: pnpm run test:numero-police\n');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`devis_simules\` WHERE \`reference\` LIKE 'DEV-%'`);
        await queryRunner.query(`DELETE FROM \`grilles_tarifaires\` WHERE \`nom\` LIKE '%Test%'`);
        await queryRunner.query(`DELETE FROM \`produits\` WHERE \`nom\` LIKE '%Test'`);
        await queryRunner.query(`DELETE FROM \`categories_produits\` WHERE \`code\` IN ('230','240','150','160')`);
        await queryRunner.query(`DELETE FROM \`branches_produits\` WHERE \`nom\` LIKE '%Test'`);
        await queryRunner.query(`DELETE FROM \`users\` WHERE \`email\` = 'test.police@example.com'`);
    }
}
