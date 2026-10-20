import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('clinic_branding')
export class ClinicBranding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinic_id: string;

  @OneToOne(() => Clinic, (clinic) => clinic.branding, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  favicon_url: string;

  @Column({ type: 'varchar', length: 7, default: '#1890ff' })
  primary_color: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondary_color: string;

  @Column({ type: 'text', nullable: true })
  welcome_message: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
