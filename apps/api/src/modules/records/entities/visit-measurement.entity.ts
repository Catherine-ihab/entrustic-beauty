import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Visit } from './visit.entity';

@Entity('visit_measurements')
@Index(['clinic_id', 'patient_id', 'key'])
export class VisitMeasurement {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') patient_id: string;
  @Column('uuid') visit_id: string;
  @ManyToOne(() => Visit, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'visit_id' }) visit: Visit;
  @Column({ type: 'varchar', length: 100 }) key: string;
  @Column({ type: 'numeric', precision: 10, scale: 3 }) value: number;
  @Column({ type: 'varchar', length: 30 }) unit: string;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) recorded_at: Date;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
}
