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

@Entity('inventory_batches')
@Index(['clinic_id', 'item_id'])
@Index(['clinic_id', 'expiry_date'])
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column('uuid') @Index() item_id: string;
  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'item_id' }) item: InventoryItem;
  @Column({ type: 'varchar', length: 80, nullable: true }) batch_number: string | null;
  @Column({ type: 'date', nullable: true }) expiry_date: string | null;
  @Column({ type: 'integer', default: 0 }) quantity_in: number;
  @Column({ type: 'integer', default: 0 }) quantity_remaining: number;
  @Column({ type: 'timestamptz' }) received_at: Date;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
}