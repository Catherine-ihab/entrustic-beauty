import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Clinic } from '../../tenants/entities/clinic.entity';
import { Visit } from './visit.entity';

@Entity('visit_diagnoses')
@Index(['clinic_id', 'visit_id'])
export class VisitDiagnosis {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') visit_id: string;
  @ManyToOne(() => Visit, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'visit_id' }) visit: Visit;
  @Column({ type: 'varchar', length: 20, nullable: true }) code: string | null;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'boolean', default: false }) is_primary: boolean;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}
