import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ContratService } from '../produits/services/contrat.service';
import { DataSource } from 'typeorm';

/**
 * Script pour tester la génération des numéros de police
 * Usage: npm run test:numero-police
 */
async function testNumeroPolice() {
    console.log('🚀 Démarrage du test de génération des numéros de police...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const contratService = app.get(ContratService);
    const dataSource = app.get(DataSource);

    try {
        // 1. Récupérer les devis payés disponibles
        const devisPayes = await dataSource.query(`
            SELECT d.id, d.reference, p.nom as produit_nom, p.type, c.code as categorie_code
            FROM devis_simules d
            INNER JOIN produits p ON d.produit_id = p.id
            LEFT JOIN categories_produits c ON p.categorie_id = c.id
            WHERE d.statut = 'paye'
            AND NOT EXISTS (
                SELECT 1 FROM contrats ct WHERE ct.devis_simule_id = d.id
            )
            LIMIT 10
        `);

        if (devisPayes.length === 0) {
            console.log('❌ Aucun devis payé disponible pour créer des contrats');
            console.log('💡 Exécutez d\'abord la migration de seed: npm run migration:run');
            await app.close();
            return;
        }

        console.log(`✅ ${devisPayes.length} devis payés trouvés\n`);

        // 2. Créer des contrats pour chaque devis
        const contratsCreés: any[] = [];

        for (const devis of devisPayes) {
            try {
                console.log(`📝 Création du contrat pour le devis ${devis.reference}...`);
                console.log(`   Produit: ${devis.produit_nom} (${devis.type})`);
                console.log(`   Catégorie: ${devis.categorie_code || 'N/A'}`);

                const contrat = await contratService.creerContratDepuisDevis(devis.id);

                console.log(`   ✅ Contrat créé: ${contrat.numero_contrat}\n`);
                contratsCreés.push({
                    numero: contrat.numero_contrat,
                    type: devis.type,
                    categorie: devis.categorie_code,
                    devis: devis.reference
                });
            } catch (error: any) {
                console.log(`   ❌ Erreur: ${error.message}\n`);
            }
        }

        // 3. Afficher le résumé
        console.log('\n' + '='.repeat(80));
        console.log('📊 RÉSUMÉ DES NUMÉROS DE POLICE GÉNÉRÉS');
        console.log('='.repeat(80) + '\n');

        if (contratsCreés.length === 0) {
            console.log('❌ Aucun contrat créé');
        } else {
            // Grouper par type
            const vie = contratsCreés.filter(c => c.type === 'vie');
            const nonVie = contratsCreés.filter(c => c.type === 'non-vie');

            if (vie.length > 0) {
                console.log('🟢 ASSURANCE VIE:');
                vie.forEach((c, i) => {
                    console.log(`   ${i + 1}. ${c.numero} (Catégorie: ${c.categorie || 'N/A'})`);
                });
                console.log('');
            }

            if (nonVie.length > 0) {
                console.log('🟠 ASSURANCE NON-VIE:');
                nonVie.forEach((c, i) => {
                    console.log(`   ${i + 1}. ${c.numero} (Catégorie: ${c.categorie || 'N/A'})`);
                });
                console.log('');
            }

            console.log(`✅ Total: ${contratsCreés.length} contrats créés avec succès`);
        }

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await app.close();
    }
}

// Exécuter le script
testNumeroPolice()
    .then(() => {
        console.log('✅ Test terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
