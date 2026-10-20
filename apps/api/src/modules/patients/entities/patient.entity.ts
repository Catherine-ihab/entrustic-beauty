import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Gender, PatientStatus } from '@clinic/shared-types';
import { Clinic } from '../../tenants/entities/clinic.entity';

@Entity('patients')
@Index(['clinic_id', 'patient_number'], { unique: true })
@Index(['clinic_id', 'last_name', 'first_name'])
@Index(['clinic_id', 'phone'])
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ type: 'varchar', length: 50 })
  patient_number: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: string | null;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.UNSPECIFIED,
  })
  gender: Gender;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergency_contact_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergency_contact_phone: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  blood_type: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.ACTIVE,
  })
  status: PatientStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
