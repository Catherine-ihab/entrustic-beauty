import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { SequenceType } from '@clinic/shared-types';

@Entity('tenant_sequences')
export class TenantSequence {
  @PrimaryColumn('uuid')
  clinic_id: string;

  @PrimaryColumn({
    type: 'enum',
    enum: SequenceType,
  })
  sequence_type: SequenceType;

  @Column({ type: 'bigint', default: 0 })
  current_value: string;

  @Column({ type: 'varchar', length: 16 })
  prefix: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
