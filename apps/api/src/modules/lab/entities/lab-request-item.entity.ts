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
import { LabRequest } from './lab-request.entity';
import { LabTest } from './lab-test.entity';

@Entity('lab_request_items')
@Index(['clinic_id', 'request_id'])
@Index(['clinic_id', 'test_id'])
export class LabRequestItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') request_id: string;
  @ManyToOne(() => LabRequest, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'request_id' }) request: LabRequest;
  @Column('uuid') test_id: string;
  @ManyToOne(() => LabTest, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'test_id' }) test: LabTest;
  @Column({ type: 'varchar', length: 20, default: 'ordered' }) status: string;
  @Column({ type: 'varchar', length: 80, nullable: true }) result_value: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) result_unit: string | null;
  @Column({ type: 'varchar', length: 10, nullable: true }) result_flag: 'low' | 'normal' | 'high' | null;
  @Column({ type: 'text', nullable: true }) result_notes: string | null;
  @Column('uuid', { nullable: true }) resulted_by: string | null;
  @Column({ type: 'timestamptz', nullable: true }) resulted_at: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}