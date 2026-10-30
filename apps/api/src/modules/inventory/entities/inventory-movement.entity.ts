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
import { InventoryItem } from './inventory-item.entity';
import { InventoryBatch } from './inventory-batch.entity';

export type InventoryMovementType = 'receive' | 'consume' | 'adjust';

@Entity('inventory_movements')
@Index(['clinic_id', 'item_id'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') @Index() item_id: string;
  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'item_id' }) item: InventoryItem;
  @Column({ type: 'uuid', nullable: true }) @Index() batch_id: string | null;
  @ManyToOne(() => InventoryBatch, { onDelete: 'SET NULL' }) @JoinColumn({ name: 'batch_id' }) batch: InventoryBatch | null;
  @Column({ type: 'varchar', length: 10 }) movement_type: InventoryMovementType;
  @Column({ type: 'integer' }) quantity: number;
  @Column({ type: 'text', nullable: true }) reason: string | null;
  /** Session / visit that caused this movement — used for idempotent retries. */
  @Column({ type: 'varchar', length: 120, nullable: true }) reference_id: string | null;
  @Column({ type: 'uuid', nullable: true }) created_by: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}