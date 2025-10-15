import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Produit, TypeProduit, PeriodicitePrime } from './produit.entity';
import { DevisSimule } from './devis-simule.entity';
import type { Beneficiaire } from './beneficiaire.entity';
import { GrilleTarifaire } from './grille-tarifaire.entity';

export enum StatutContrat {
    ACTIF = 'actif',
    SUSPENDU = 'suspendu',
    RESILIE = 'resilie',
    EXPIRE = 'expire'
}

@Entity('contrats')
export class Contrat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
    numero_contrat: string; // Ex: VIE-2025-000001, NONVIE-2025-000001

    @Column({ type: 'uuid', nullable: false })
    devis_simule_id: string;

    @Column({ type: 'uuid', nullable: false })
    produit_id: string;

    @Column({ type: 'uuid', nullable: false })
    grille_tarifaire_id: string;

    @Column({ type: 'uuid', nullable: false })
    utilisateur_id: string;

    @Column({ type: 'json', nullable: false })
    criteres_utilisateur: Record<string, any>;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    prime_mensuelle: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    franchise: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    plafond: number;

    @Column({
        type: 'enum',
        enum: PeriodicitePrime,
        default: 'mensuel'
    })
    periodicite_paiement: PeriodicitePrime;

    @Column({ type: 'int', default: 12 })
    duree_couverture: number; // en mois

    @Column({ type: 'timestamp', nullable: false })
    date_debut_couverture: Date;

    @Column({ type: 'timestamp', nullable: false })
    date_fin_couverture: Date;

    @Column({
        type: 'enum',
        enum: StatutContrat,
        default: 'actif'
    })
    statut: StatutContrat;

    @Column({ type: 'json', nullable: true })
    informations_assure: Record<string, any>;

    @Column({ type: 'boolean', default: true })
    assure_est_souscripteur: boolean;

    @Column({ type: 'varchar', length: 500, nullable: true })
    chemin_recto_assure: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    chemin_verso_assure: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @ManyToOne(() => DevisSimule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'devis_simule_id' })
    devisSimule: DevisSimule;

    @ManyToOne(() => Produit, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'produit_id' })
    produit: Produit;

    @ManyToOne(() => GrilleTarifaire, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'grille_tarifaire_id' })
    grilleTarifaire: GrilleTarifaire;

    @OneToMany('Beneficiaire', 'contrat', { cascade: true })
    beneficiaires: any[];
}
