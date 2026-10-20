import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from './patient.entity';

export type AllergyType = 'medication' | 'food' | 'environmental' | 'latex' | 'contrast' | 'other' | 'unknown';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'unknown';
export type AllergyStatus = 'active' | 'resolved' | 'unconfirmed';

@Entity('patient_allergies')
@Index(['clinic_id', 'patient_id'])
export class PatientAllergy {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'text' }) allergen: string;
  @Column({ type: 'varchar', length: 30, default: 'unknown' }) allergy_type: AllergyType;
  @Column({ type: 'text', nullable: true }) reaction: string | null;
  @Column({ type: 'varchar', length: 30, default: 'unknown' }) severity: AllergySeverity;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status: AllergyStatus;
  @Column({ type: 'date', nullable: true }) onset_date: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
