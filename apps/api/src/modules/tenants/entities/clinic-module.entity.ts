import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('clinic_modules')
export class ClinicModule {
  @PrimaryColumn('uuid')
  clinic_id: string;

  @PrimaryColumn({ type: 'varchar', length: 50 })
  module_key: string;

  @Column({ type: 'boolean', default: true })
  is_enabled: boolean;

  @ManyToOne(() => Clinic, (clinic) => clinic.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @CreateDateColumn({ type: 'timestamptz' })
  enabled_at: Date;
}
