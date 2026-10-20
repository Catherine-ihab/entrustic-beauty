import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ClinicStatus, ClinicType } from '@clinic/shared-types';
import { ClinicBranding } from './clinic-branding.entity';
import { ClinicModule } from './clinic-module.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  slug: string;

  @Column({
    type: 'enum',
    enum: ClinicType,
    default: ClinicType.GENERAL_MEDICAL,
  })
  clinic_type: ClinicType;

  @Column({ type: 'simple-array', nullable: true })
  specialties: string[];

  @Column({
    type: 'enum',
    enum: ClinicStatus,
    default: ClinicStatus.TRIAL,
  })
  status: ClinicStatus;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  default_language: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 100, default: 'UTC' })
  timezone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @OneToOne(() => ClinicBranding, (branding) => branding.clinic, { cascade: true })
  branding: ClinicBranding;

  @OneToMany(() => ClinicModule, (clinicModule) => clinicModule.clinic)
  modules: ClinicModule[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
