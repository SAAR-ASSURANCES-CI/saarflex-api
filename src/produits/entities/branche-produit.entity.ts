import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Produit } from './produit.entity';
import { CategorieProduit } from './categorie-produit.entity';

export enum TypeBranche {
  VIE = 'vie',
  NON_VIE = 'non-vie'
}

@Entity('branches_produits')
export class BrancheProduit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom: string;

  @Column({
    type: 'enum',
    enum: TypeBranche,
    nullable: false
  })
  type: TypeBranche;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @OneToMany(() => Produit, produit => produit.branche)
  produits: Produit[];

  @OneToMany(() => CategorieProduit, categorie => categorie.branche)
  categories: CategorieProduit[];
}
