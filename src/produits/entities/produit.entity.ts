import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BrancheProduit } from './branche-produit.entity';
import { CategorieProduit } from './categorie-produit.entity';
import { CritereTarification } from './critere-tarification.entity';
import { GrilleTarifaire } from './grille-tarifaire.entity';
import { DevisSimule } from './devis-simule.entity';
import { Garantie } from './garantie.entity';
import { User } from '../../users/entities/user.entity';

export enum TypeProduit {
  VIE = 'vie',
  NON_VIE = 'non-vie'
}

export enum StatutProduit {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  BROUILLON = 'brouillon'
}

export enum PeriodicitePrime {
  JOURNALIER = 'journalier',
  MENSUEL = 'mensuel',
  ANNUEL = 'annuel'
}

@Entity('produits')
export class Produit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: TypeProduit,
    nullable: false
  })
  type: TypeProduit;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  conditions_pdf: string;

  @Column({
    type: 'enum',
    enum: StatutProduit,
    default: 'brouillon'
  })
  statut: StatutProduit;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid', nullable: false })
  created_by: string;

  @Column({ type: 'boolean', default: false })
  necessite_beneficiaires: boolean;

  @Column({ type: 'int', default: 0 })
  max_beneficiaires: number;

  @Column({
    type: 'enum',
    enum: PeriodicitePrime,
    default: PeriodicitePrime.MENSUEL
  })
  periodicite_prime: PeriodicitePrime;

  @ManyToOne(() => BrancheProduit, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branche: BrancheProduit;

  @ManyToOne(() => CategorieProduit, { nullable: true })
  @JoinColumn({ name: 'categorie_id' })
  categorie: CategorieProduit;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createur: User;

  @OneToMany(() => CritereTarification, critere => critere.produit, { cascade: true })
  criteres: CritereTarification[];

  @OneToMany(() => GrilleTarifaire, grille => grille.produit, { cascade: true })
  grilles: GrilleTarifaire[];

  @OneToMany(() => DevisSimule, devis => devis.produit, { cascade: true })
  devis: DevisSimule[];

  @OneToMany(() => Garantie, garantie => garantie.produit, { cascade: true })
  garanties: Garantie[];
}
