import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { ClinicService } from '../../services/entities/clinic-service.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @Column('uuid')
  invoice_id: string;

  @ManyToOne(() => Invoice, (inv) => inv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true })
  service_id: string | null;

  @ManyToOne(() => ClinicService, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: ClinicService | null;

  // SNAPSHOT: captured permanently at time of invoice creation
  @Column({ type: 'varchar', length: 255 })
  description: string;

  // SNAPSHOT: captured permanently at time of invoice creation
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  line_total: number;
}
