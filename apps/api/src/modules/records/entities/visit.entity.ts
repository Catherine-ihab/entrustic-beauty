import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { VisitStatus } from '@clinic/shared-types';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { VisitVersion } from './visit-version.entity';

@Entity('visits')
@Index(['clinic_id', 'patient_id'])
@Index(['clinic_id', 'provider_id'])
export class Visit {
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

  @Column({ type: 'uuid', nullable: true })
  appointment_id: string | null;

  @Column('uuid')
  provider_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @Column({ type: 'timestamptz' })
  original_visit_date: Date;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.FINALIZED,
  })
  status: VisitStatus;

  @Column({ type: 'int', default: 1 })
  current_version: number;

  @OneToMany(() => VisitVersion, (version) => version.visit, { cascade: true })
  versions: VisitVersion[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
