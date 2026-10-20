import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Persistent room event log — WebRTC signaling (offer/answer/ice), join/leave
 * presence, and room chat. Clients poll with `?after=<seq>` (short polling),
 * which keeps the feature dependency-free (no WebSocket server required).
 */
@Entity('telemedicine_signals')
@Index(['appointment_id', 'seq'])
export class TelemedicineSignal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  clinic_id: string;

  @Column('uuid')
  appointment_id: string;

  @Column({ type: 'varchar', length: 10 })
  sender: 'patient' | 'provider';

  @Column({ type: 'varchar', length: 16 })
  kind: 'join' | 'leave' | 'offer' | 'answer' | 'ice' | 'chat';

  @Column({ type: 'text', nullable: true })
  payload: string | null;

  /** Monotonic room cursor (bigserial) — returned as a string by node-postgres. */
  @Column({ type: 'bigint', generated: 'increment' })
  seq: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
