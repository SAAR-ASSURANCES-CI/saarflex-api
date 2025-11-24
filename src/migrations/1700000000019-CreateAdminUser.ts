import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminUser1700000000019 implements MigrationInterface {
    name = 'CreateAdminUser1700000000019';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO users (
                id,
                nom,
                email,
                mot_de_passe,
                type_utilisateur,
                statut,
                premiere_connexion,
                mot_de_passe_temporaire,
                date_creation,
                date_modification
            ) VALUES (
                'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                'Administrateur',
                'admin@saarassurancesci.com',
                '$2b$12$7d9feUZz7NdevccmJiXolOhfVwlp2GsWSbWzPLgllH7eNprWFzedC',
                'admin',
                1,
                0,
                0,
                NOW(),
                NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM users WHERE email = 'admin@saarassurancesci.com'
        `);
    }
}
