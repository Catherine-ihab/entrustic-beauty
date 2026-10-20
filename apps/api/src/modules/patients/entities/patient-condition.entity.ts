import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from './patient.entity';

export type ConditionStatus = 'active' | 'resolved' | 'managed' | 'suspected';
export type ConditionSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

@Entity('patient_conditions')
@Index(['clinic_id', 'patient_id'])
export class PatientCondition {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'text' }) name: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) icd_code: string | null;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status: ConditionStatus;
  @Column({ type: 'varchar', length: 20, nullable: true, default: 'moderate' }) severity: ConditionSeverity | null;
  @Column({ type: 'date', nullable: true }) onset_date: string | null;
  @Column({ type: 'date', nullable: true }) resolution_date: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
