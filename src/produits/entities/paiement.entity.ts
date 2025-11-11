import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DevisSimule } from './devis-simule.entity';
import { Contrat } from './contrat.entity';
import { User } from '../../users/entities/user.entity';

export enum StatutPaiement {
    EN_ATTENTE = 'en_attente',
    REUSSI = 'reussi',
    ECHOUE = 'echoue',
    REMBOURSE = 'rembourse',
    ANNULE = 'annule'
}

export enum MethodePaiement {
    MOBILE_MONEY = 'mobile_money',
    WALLET = 'wallet'
}

@Entity('paiements')
export class Paiement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    reference_paiement: string;

    @Column({ type: 'uuid', nullable: false })
    devis_simule_id: string;

    @Column({ type: 'uuid', nullable: true })
    contrat_id: string;

    @Column({ type: 'uuid', nullable: false })
    utilisateur_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    montant: number;

    @Column({
        type: 'enum',
        enum: MethodePaiement,
        nullable: false
    })
    methode_paiement: MethodePaiement;

    @Column({
        type: 'enum',
        enum: StatutPaiement,
        default: StatutPaiement.EN_ATTENTE
    })
    statut: StatutPaiement;

    @Column({ type: 'varchar', length: 255, nullable: true })
    reference_externe: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    numero_telephone: string | null;

    @Column({ type: 'json', nullable: true })
    donnees_callback: Record<string, any> | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    message_erreur: string | null;

    @Column({ type: 'timestamp', nullable: true })
    date_paiement: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    payment_token: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    payment_url: string | null;

    @Column({ type: 'varchar', length: 3, nullable: true })
    currency: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    cinetpay_transaction_id: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    operator_id: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => DevisSimule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'devis_simule_id' })
    devisSimule: DevisSimule;

    @ManyToOne(() => Contrat, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'contrat_id' })
    contrat: Contrat;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'utilisateur_id' })
    utilisateur: User;
}

