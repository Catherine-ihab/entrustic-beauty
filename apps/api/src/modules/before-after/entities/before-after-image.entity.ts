import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BeforeAfterImageType } from '@clinic/shared-types';
import { BeforeAfterRecord } from './before-after-record.entity';

@Entity('before_after_images')
export class BeforeAfterImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @Column('uuid')
  record_id: string;

  @ManyToOne(() => BeforeAfterRecord, (record) => record.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: BeforeAfterRecord;

  @Column({
    type: 'enum',
    enum: BeforeAfterImageType,
  })
  image_type: BeforeAfterImageType;

  @Column({ type: 'varchar', length: 500 })
  storage_key: string; // S3 / MinIO object key

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  taken_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
