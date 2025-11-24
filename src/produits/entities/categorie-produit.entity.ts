import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { BrancheProduit } from './branche-produit.entity';
import { Produit } from './produit.entity';

@Entity('categories_produits')
@Unique(['code', 'branche']) // Unicité du code par branche
export class CategorieProduit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    code: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    libelle: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => BrancheProduit, branche => branche.categories, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'branche_id' })
    branche: BrancheProduit;

    @OneToMany(() => Produit, produit => produit.categorie)
    produits: Produit[];
}
