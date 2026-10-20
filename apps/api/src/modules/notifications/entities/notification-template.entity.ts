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
import { NotificationChannel } from '@clinic/shared-types';

@Entity('notification_templates')
@Index(['clinic_id', 'key', 'channel'], { unique: true })
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column({ type: 'varchar', length: 60 }) key: string;
  @Column({ type: 'varchar', length: 10 }) channel: NotificationChannel;
  @Column({ type: 'varchar', length: 120 }) name: string;
  @Column({ type: 'text' }) body: string;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
