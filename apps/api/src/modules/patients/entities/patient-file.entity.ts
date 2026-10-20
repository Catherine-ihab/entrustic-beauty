import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from './patient.entity';

export type FileCategory = 'radiology' | 'lab' | 'report' | 'prescription' | 'image' | 'video' | 'consent' | 'referral' | 'other';

@Entity('patient_files')
@Index(['clinic_id', 'patient_id'])
@Index(['clinic_id', 'patient_id', 'visit_id'])
export class PatientFile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'uuid', nullable: true }) visit_id: string | null;
  @Column({ type: 'varchar', length: 30, default: 'other' }) category: FileCategory;
  @Column({ type: 'text' }) file_name: string;
  @Column({ type: 'varchar', length: 100 }) mime_type: string;
  @Column({ type: 'bigint' }) size_bytes: number;
  @Column({ type: 'text' }) storage_key: string;
  @Column({ type: 'varchar', length: 100 }) storage_bucket: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'simple-array', nullable: true, default: '' }) tags: string[];
  @Column({ type: 'uuid', nullable: true }) uploaded_by: string | null;
  @Column({ type: 'boolean', default: false }) is_archived: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
