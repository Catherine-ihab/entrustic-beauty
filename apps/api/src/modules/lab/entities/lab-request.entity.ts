import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from '../../patients/entities/patient.entity';

export type LabRequestStatus = 'ordered' | 'collected' | 'in_progress' | 'completed' | 'cancelled';

@Entity('lab_requests')
@Index(['clinic_id', 'request_number'], { unique: true })
@Index(['clinic_id', 'patient_id'])
@Index(['clinic_id', 'status'])
export class LabRequest {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column('uuid', { nullable: true }) visit_id: string | null;
  @Column({ type: 'varchar', length: 30 }) request_number: string;
  @Column('uuid', { nullable: true }) requested_by: string | null;
  @Column({ type: 'varchar', length: 20, default: 'ordered' }) status: LabRequestStatus;
  @Column({ type: 'varchar', length: 10, default: 'routine' }) priority: 'routine' | 'urgent' | 'stat';
  @Column({ type: 'text', nullable: true }) clinical_notes: string | null;
  @Column({ type: 'timestamptz', nullable: true }) collected_at: Date | null;
  @Column('uuid', { nullable: true }) collected_by: string | null;
  @Column('uuid', { nullable: true }) lab_technician: string | null;
  @Column({ type: 'timestamptz', nullable: true }) completed_at: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}