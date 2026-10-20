import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Drug } from './drug.entity';

export type InteractionSeverity = 'minor' | 'moderate' | 'major';

@Entity('drug_interactions')
@Index(['clinic_id', 'drug_a_id', 'drug_b_id'], { unique: true })
export class DrugInteraction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') @Index() drug_a_id: string;
  @ManyToOne(() => Drug, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'drug_a_id' }) drugA: Drug;
  @Column('uuid') @Index() drug_b_id: string;
  @ManyToOne(() => Drug, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'drug_b_id' }) drugB: Drug;
  @Column({ type: 'varchar', length: 10 }) severity: InteractionSeverity;
  @Column({ type: 'text', nullable: true }) advice: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}