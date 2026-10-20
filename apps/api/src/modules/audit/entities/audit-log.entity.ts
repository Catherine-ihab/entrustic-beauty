import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['clinic_id', 'created_at'])
@Index(['entity_type', 'entity_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  clinic_id: string | null;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_email: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: string; // e.g. CREATE, UPDATE, DELETE, LOGIN

  @Column({ type: 'varchar', length: 50 })
  entity_type: string; // e.g. patient, visit, appointment, invoice

  @Column({ type: 'uuid', nullable: true })
  entity_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, { old: any; new: any }> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
