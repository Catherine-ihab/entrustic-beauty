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
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { BeforeAfterImage } from './before-after-image.entity';

@Entity('before_after_records')
@Index(['clinic_id', 'patient_id'])
export class BeforeAfterRecord {
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

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  treatment_description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date' })
  recorded_date: string;

  @Column('uuid')
  created_by: string;

  @OneToMany(() => BeforeAfterImage, (img) => img.record, { cascade: true })
  images: BeforeAfterImage[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
