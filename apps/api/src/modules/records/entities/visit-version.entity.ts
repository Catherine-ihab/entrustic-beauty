import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Visit } from './visit.entity';
import { User } from '../../users/entities/user.entity';

@Entity('visit_versions')
@Index(['visit_id', 'version_number'], { unique: true })
export class VisitVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @Column('uuid')
  visit_id: string;

  @ManyToOne(() => Visit, (visit) => visit.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;

  @Column({ type: 'int' })
  version_number: number;

  @Column({ type: 'text', nullable: true })
  chief_complaint: string | null;

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ type: 'text', nullable: true })
  treatment_plan: string | null;

  @Column({ type: 'text', nullable: true })
  clinical_notes: string | null;

  @Column({ type: 'date', nullable: true })
  follow_up_date: string | null;

  @Column({ type: 'jsonb', default: {} })
  custom_fields: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  change_reason: string | null;

  @Column('uuid')
  changed_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  author: User;

  @CreateDateColumn({ type: 'timestamptz' })
  changed_at: Date;
}
