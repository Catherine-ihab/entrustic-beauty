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
import { AppointmentStatus } from '@clinic/shared-types';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { ClinicService } from '../../services/entities/clinic-service.entity';

@Entity('appointments')
@Index(['clinic_id', 'provider_id', 'start_time'])
@Index(['clinic_id', 'patient_id'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column('uuid')
  patient_id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column('uuid')
  provider_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @Column({ type: 'uuid', nullable: true })
  service_id: string | null;

  @ManyToOne(() => ClinicService, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: ClinicService | null;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'timestamptz' })
  end_time: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  /** 'in_person' (default) or 'telemedicine'. */
  @Column({ type: 'varchar', length: 16, default: 'in_person' })
  visit_type: string;

  /** Telemedicine room identifier (minted when visit_type = telemedicine). */
  @Column({ type: 'varchar', length: 12, nullable: true })
  room_code: string | null;

  /** Nullable: patient-portal bookings are not created by a staff user. */
  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
