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

export type ServiceCategory = 'laser' | 'injectables' | 'skincare' | 'bodycare' | 'spa' | 'general';
export type QueueStatus = 'waiting' | 'calling' | 'in-progress' | 'done' | 'cancelled';

@Entity('queue_entries')
export class QueueEntry {
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

  @Column({ type: 'varchar', length: 255 })
  patient_name: string;

  @Column({ type: 'varchar', length: 50 })
  patient_phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  patient_number: string | null;

  @Column({ type: 'text' })
  service_name: string;

  @Column({ type: 'varchar', length: 32, default: 'general' })
  service_category: ServiceCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  package_name: string | null;

  @Column({ type: 'int', nullable: true })
  package_session_number: number | null;

  @Column({ type: 'int', nullable: true })
  package_total_sessions: number | null;

  @Column({ type: 'uuid', nullable: true })
  invoice_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice_number: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paid_amount: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_amount: number | null;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;

  @Column({ type: 'varchar', length: 32 })
  scheduled_time: string;

  @Column({ type: 'varchar', length: 32, default: 'waiting' })
  status: QueueStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  added_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  doctor_notes: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  practitioner: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
