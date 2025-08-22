import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Produit } from './produit.entity';
import { Tarif } from './tarif.entity';

export enum StatutGrille {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  FUTUR = 'futur'
}

@Entity('grilles_tarifaires')
export class GrilleTarifaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  produit_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom: string;

  @Column({ type: 'date', nullable: false })
  date_debut: Date;

  @Column({ type: 'date', nullable: true })
  date_fin: Date;

  @Column({ 
    type: 'enum', 
    enum: StatutGrille, 
    default: StatutGrille.INACTIF 
  })
  statut: StatutGrille;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid', nullable: false })
  created_by: string;

  // Relations
  @ManyToOne(() => Produit, produit => produit.grilles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produit_id' })
  produit: Produit;

  @OneToMany(() => Tarif, tarif => tarif.grilleTarifaire, { cascade: true })
  tarifs: Tarif[];
}
