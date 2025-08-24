import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Garantie } from './garantie.entity';

export enum StatutTarifGarantie {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  FUTUR = 'futur'
}

@Entity('tarifs_garanties')
@Index(['garantie_id'])
@Index(['statut'])
@Index(['date_debut', 'date_fin'])
@Index(['created_by'])
export class TarifGarantie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: false })
  garantie_id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    comment: 'Montant de base en FCFA'
  })
  montant_base: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pourcentage appliqué sur le montant du produit'
  })
  pourcentage_produit: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Formule de calcul personnalisée'
  })
  formule_calcul: string;

  @Column({ type: 'date', nullable: false })
  date_debut: Date;

  @Column({ type: 'date', nullable: true })
  date_fin: Date;

  @Column({
    type: 'enum',
    enum: StatutTarifGarantie,
    default: StatutTarifGarantie.ACTIF
  })
  statut: StatutTarifGarantie;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Garantie, garantie => garantie.tarifs_garanties, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'garantie_id' })
  garantie: Garantie;


}
