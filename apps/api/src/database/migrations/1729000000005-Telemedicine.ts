import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase A5 — Patient Portal + Telemedicine (shared across all specialties):
 *   appointments          + visit_type ('in_person'|'telemedicine') + room_code
 *   patient_otps          — one-time login codes for the patient portal
 *   telemedicine_signals  — persistent WebRTC signaling (offer/answer/ice),
 *                           join/leave presence, and room chat (short polling)
 *
 * All new tables are tenant-scoped (clinic_id) with the platform RLS pattern
 * (app.current_tenant_id). Telemedicine needs no media server: peers exchange
 * SDP/ICE over this table, so the feature runs with zero new dependencies.
 */
export class Telemedicine1729000000005 implements MigrationInterface {
  name = 'Telemedicine1729000000005';

  public async up(qr: QueryRunner): Promise<void> {
    // ─── APPOINTMENTS: visit type + telemedicine room code ───────────────────
    await qr.query(`
      ALTER TABLE appointments
        ADD COLUMN visit_type varchar(16) NOT NULL DEFAULT 'in_person'
    `);
    await qr.query(`
      ALTER TABLE appointments
        ADD CONSTRAINT ck_appointments_visit_type
        CHECK (visit_type IN ('in_person','telemedicine'))
    `);
    await qr.query(`
      ALTER TABLE appointments ADD COLUMN room_code varchar(12)
    `);
    await qr.query(`
      CREATE UNIQUE INDEX uq_appointments_room_code
        ON appointments (clinic_id, room_code) WHERE room_code IS NOT NULL
    `);

    // ─── PATIENT OTPS (portal login codes) ──────────────────────────────────
    await qr.query(`
      CREATE TABLE patient_otps (
        id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        patient_id  uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
        channel     varchar(10) NOT NULL CHECK (channel IN ('sms','whatsapp')),
        recipient   varchar(50) NOT NULL,
        code_hash   varchar(200) NOT NULL,
        expires_at  timestamptz NOT NULL,
        consumed_at timestamptz,
        attempts    integer NOT NULL DEFAULT 0,
        created_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_patient_otps_clinic_patient
        ON patient_otps (clinic_id, patient_id, created_at DESC);
    `);

    // ─── TELEMEDICINE SIGNALS (persistent room event log) ───────────────────
    await qr.query(`
      CREATE TABLE telemedicine_signals (
        id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id      uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        appointment_id uuid NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
        sender         varchar(10) NOT NULL CHECK (sender IN ('patient','provider')),
        kind           varchar(16) NOT NULL
                       CHECK (kind IN ('join','leave','offer','answer','ice','chat')),
        payload        text,
        seq            bigserial,
        created_at     timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_telemedicine_signals_room
        ON telemedicine_signals (appointment_id, seq);
      CREATE INDEX idx_telemedicine_signals_clinic
        ON telemedicine_signals (clinic_id);
    `);

    // ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────
    for (const table of ['patient_otps', 'telemedicine_signals']) {
      await qr.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await qr.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      await qr.query(`
        CREATE POLICY tenant_isolation ON ${table}
          USING (clinic_id::text = current_setting('app.current_tenant_id', true))
          WITH CHECK (clinic_id::text = current_setting('app.current_tenant_id', true));
      `);
    }
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS telemedicine_signals`);
    await qr.query(`DROP TABLE IF EXISTS patient_otps`);
    await qr.query(`DROP INDEX IF EXISTS uq_appointments_room_code`);
    await qr.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ck_appointments_visit_type`);
    await qr.query(`ALTER TABLE appointments DROP COLUMN IF EXISTS room_code`);
    await qr.query(`ALTER TABLE appointments DROP COLUMN IF EXISTS visit_type`);
  }
}
