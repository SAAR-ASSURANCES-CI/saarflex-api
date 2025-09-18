import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DevisSimule } from './devis-simule.entity';

@Entity('beneficiaires')
export class Beneficiaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  devis_simule_id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nom_complet: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lien_souscripteur: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  ordre: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => DevisSimule, devis => devis.beneficiaires, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'devis_simule_id' })
  devisSimule: DevisSimule;
}
