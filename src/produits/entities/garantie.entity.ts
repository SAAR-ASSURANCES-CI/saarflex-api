import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Produit } from './produit.entity';
import { GarantieCritere } from './garantie-critere.entity';
import { TarifGarantie } from './tarif-garantie.entity';

export enum TypeGarantie {
  OBLIGATOIRE = 'obligatoire',
  OPTIONNELLE = 'optionnelle'
}

export enum StatutGarantie {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Entity('garanties')
@Index(['produit_id'])
@Index(['type'])
@Index(['statut'])
@Index(['ordre'])
@Index(['created_by'])
export class Garantie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TypeGarantie,
    default: TypeGarantie.OBLIGATOIRE
  })
  type: TypeGarantie;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Montant garanti en FCFA'
  })
  montant_garanti: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0.00,
    comment: 'Franchise en FCFA'
  })
  franchise: number;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Column({ type: 'varchar', length: 36, nullable: false })
  produit_id: string;

  @Column({
    type: 'enum',
    enum: StatutGarantie,
    default: StatutGarantie.ACTIVE
  })
  statut: StatutGarantie;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Produit, produit => produit.garanties, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'produit_id' })
  produit: Produit;



  // Relations inverses
  @OneToMany(() => GarantieCritere, garantieCritere => garantieCritere.garantie, { cascade: true })
  garanties_criteres: GarantieCritere[];

  @OneToMany(() => TarifGarantie, tarifGarantie => tarifGarantie.garantie, { cascade: true })
  tarifs_garanties: TarifGarantie[];
}
