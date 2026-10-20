import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { User } from '../../users/entities/user.entity';
import { Drug } from './drug.entity';

@Entity('doctor_favorite_drugs')
@Index(['clinic_id', 'doctor_id', 'drug_id'], { unique: true })
export class DoctorFavoriteDrug {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') @Index() doctor_id: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'doctor_id' }) doctor: User;
  @Column('uuid') drug_id: string;
  @ManyToOne(() => Drug, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'drug_id' }) drug: Drug;
  @Column({ type: 'integer', default: 1 }) usage_count: number;
  @CreateDateColumn({ type: 'timestamptz' }) last_used_at: Date;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}