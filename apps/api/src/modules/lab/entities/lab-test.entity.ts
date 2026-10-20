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

@Entity('lab_tests')
@Index(['clinic_id', 'name'], { unique: true })
@Index(['clinic_id', 'category'])
export class LabTest {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 80, nullable: true }) category: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) sample_type: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) sample_tube: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) unit: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) reference_range: string | null;
  @Column({ type: 'integer', nullable: true }) turnaround_hours: number | null;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}