import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { PrescriptionItem } from './prescription-item.entity';

export type PrescriptionStatus = 'issued' | 'printed' | 'dispensed' | 'cancelled';

@Entity('prescriptions')
@Index(['clinic_id', 'patient_id'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'patient_id' }) patient: Patient;
  @Column({ type: 'uuid', nullable: true }) visit_id: string | null;
  @Column({ type: 'uuid', nullable: true }) provider_id: string | null;
  @ManyToOne(() => User, { onDelete: 'SET NULL' }) @JoinColumn({ name: 'provider_id' }) provider: User;
  @CreateDateColumn({ type: 'timestamptz' }) issued_at: Date;
  @Column({ type: 'varchar', length: 20, default: 'issued' }) status: PrescriptionStatus;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @OneToMany(() => PrescriptionItem, (item) => item.prescription, { cascade: true }) items: PrescriptionItem[];
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}