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

@Entity('inventory_items')
@Index(['clinic_id', 'sku'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') @Index() clinic_id: string;
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'clinic_id' }) clinic: Clinic;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 80, nullable: true }) sku: string | null;
  @Column({ type: 'varchar', length: 80, nullable: true }) category: string | null;
  @Column({ type: 'varchar', length: 40, default: 'unit' }) unit: string;
  @Column({ type: 'integer', default: 0 }) reorder_level: number;
  @Column({ type: 'varchar', length: 150, nullable: true }) default_vendor: string | null;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}