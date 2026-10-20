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

@Entity('drugs')
@Index(['clinic_id', 'name'], { unique: true })
export class Drug {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 200, nullable: true }) generic_name: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) category: string | null;
  @Column({ type: 'varchar', length: 60, nullable: true }) form: string | null;
  @Column({ type: 'varchar', length: 60, nullable: true }) strength: string | null;
  @Column({ type: 'text', array: true, default: () => "'{}'" }) substances: string[];
  @Column({ type: 'text', nullable: true }) common_doses: string | null;
  @Column({ type: 'boolean', default: false }) is_seed: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}