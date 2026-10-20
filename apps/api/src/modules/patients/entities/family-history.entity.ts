import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from './patient.entity';

@Entity('family_history')
@Index(['clinic_id', 'patient_id'])
export class FamilyHistory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'varchar', length: 50 }) relative: string;
  @Column({ type: 'text' }) condition: string;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
