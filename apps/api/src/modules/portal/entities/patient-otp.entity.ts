import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** Patient-portal one-time login codes (argon2-hashed, single active per patient). */
@Entity('patient_otps')
@Index(['clinic_id', 'patient_id'])
export class PatientOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinic_id: string;

  @Column('uuid')
  patient_id: string;

  @Column({ type: 'varchar', length: 10 })
  channel: 'sms' | 'whatsapp';

  @Column({ type: 'varchar', length: 50 })
  recipient: string;

  @Column({ type: 'varchar', length: 200 })
  code_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumed_at: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
