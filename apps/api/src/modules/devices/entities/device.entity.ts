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

export type DeviceStatus = 'active' | 'maintenance' | 'retired';

@Entity('devices')
@Index(['clinic_id', 'status'])
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  device_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serial_number: string | null;

  @Column({ type: 'date', nullable: true })
  purchase_date: string | null;

  @Column({ type: 'date', nullable: true })
  last_calibration: string | null;

  @Column({ type: 'date', nullable: true })
  next_calibration: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: DeviceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
