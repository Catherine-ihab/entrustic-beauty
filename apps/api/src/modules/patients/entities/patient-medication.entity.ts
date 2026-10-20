import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from './patient.entity';

@Entity('patient_medications')
@Index(['clinic_id', 'patient_id'])
export class PatientMedication {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'text' }) name: string;
  @Column({ type: 'text', nullable: true }) generic_name: string | null;
  @Column({ type: 'text', nullable: true }) dose: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) unit: string | null;
  @Column({ type: 'text', nullable: true }) frequency: string | null;
  @Column({ type: 'varchar', length: 20, default: 'oral' }) route: string;
  @Column({ type: 'date', nullable: true }) start_date: string | null;
  @Column({ type: 'date', nullable: true }) end_date: string | null;
  @Column({ type: 'boolean', default: true }) is_current: boolean;
  @Column({ type: 'text', nullable: true }) prescribed_by: string | null;
  @Column({ type: 'uuid', nullable: true }) prescribed_at_visit: string | null;
  @Column({ type: 'text', nullable: true }) reason: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
