import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeCalculToTarifsGaranties1734260000000 implements MigrationInterface {
    name = 'AddTypeCalculToTarifsGaranties1734260000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter le champ type_calcul
        await queryRunner.query(`
      ALTER TABLE \`tarifs_garanties\`
      ADD COLUMN \`type_calcul\` enum('montant_fixe','pourcentage_valeur_neuve','pourcentage_valeur_venale','formule_personnalisee') 
      NOT NULL DEFAULT 'montant_fixe' 
      COMMENT 'Type de calcul du tarif'
      AFTER \`garantie_id\`
    `);

        // Ajouter le champ taux_pourcentage
        await queryRunner.query(`
      ALTER TABLE \`tarifs_garanties\`
      ADD COLUMN \`taux_pourcentage\` decimal(5,2) NULL 
      COMMENT 'Taux de pourcentage pour calcul sur VN ou VV (ex: 3.5 pour 3.5%)'
      AFTER \`type_calcul\`
    `);

        // Modifier montant_base pour le rendre nullable
        await queryRunner.query(`
      ALTER TABLE \`tarifs_garanties\`
      MODIFY COLUMN \`montant_base\` decimal(15,2) NULL 
      COMMENT 'Montant de base en FCFA (utilisé si type_calcul = MONTANT_FIXE)'
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remettre montant_base en NOT NULL
        await queryRunner.query(`
      ALTER TABLE \`tarifs_garanties\`
      MODIFY COLUMN \`montant_base\` decimal(15,2) NOT NULL
    `);

        // Supprimer taux_pourcentage
        await queryRunner.query(`
      ALTER TABLE \`tarifs_garanties\`
      DROP COLUMN \`taux_pourcentage\`
    `);

        // Supprimer type_calcul
        await queryRunner.query(`
      ALTER TABLE \`tarifs_garanties\`
      DROP COLUMN \`type_calcul\`
    `);
    }
}
