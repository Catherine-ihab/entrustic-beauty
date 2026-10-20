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
import { Prescription } from './prescription.entity';
import { Drug } from './drug.entity';

@Entity('prescription_items')
export class PrescriptionItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') @Index() prescription_id: string;
  @ManyToOne(() => Prescription, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;
  @Column({ type: 'uuid', nullable: true }) drug_id: string | null;
  @ManyToOne(() => Drug, { onDelete: 'SET NULL' }) @JoinColumn({ name: 'drug_id' }) drug: Drug;
  @Column({ type: 'varchar', length: 200 }) drug_name: string;
  @Column({ type: 'varchar', length: 120, nullable: true }) dose: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) frequency: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) duration: string | null;
  @Column({ type: 'text', nullable: true }) instructions: string | null;
  @Column({ type: 'integer', nullable: true }) quantity: number | null;
  @Column({ type: 'integer', default: 0 }) sort_order: number;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}