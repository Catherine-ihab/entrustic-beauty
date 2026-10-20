import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from './patient.entity';

export type ConsentType = 'treatment' | 'procedure' | 'photo' | 'data_processing' | 'research' | 'other';
export type ConsentMethod = 'verbal' | 'digital_signature' | 'written' | 'witnessed';
export type ConsentStatus = 'given' | 'withdrawn' | 'pending';

@Entity('consent_records')
@Index(['clinic_id', 'patient_id'])
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'uuid', nullable: true }) visit_id: string | null;
  @Column({ type: 'varchar', length: 30 }) consent_type: ConsentType;
  @Column({ type: 'text' }) title: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'varchar', length: 30, default: 'verbal' }) method: ConsentMethod;
  @Column({ type: 'varchar', length: 20, default: 'given' }) status: ConsentStatus;
  @Column({ type: 'timestamptz', nullable: true }) signed_at: Date | null;
  @Column({ type: 'text', nullable: true }) witness: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
