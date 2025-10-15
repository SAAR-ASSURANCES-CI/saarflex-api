import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contrat } from './contrat.entity';

@Entity('beneficiaires')
export class Beneficiaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  contrat_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom_complet: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lien_souscripteur: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  ordre: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Contrat, contrat => contrat.beneficiaires, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contrat_id' })
  contrat: Contrat;
}
