import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reminders & Messaging (WhatsApp/SMS) tables (shared across all specialties):
 *   notification_templates — per-clinic editable message bodies ({{placeholders}})
 *   notifications          — outbound message outbox/log (queued → sent/failed)
 *   reminder_settings      — one row per clinic: lead time, channels, quiet hours
 *
 * All tables are tenant-scoped (clinic_id) with the platform RLS pattern
 * (app.current_tenant_id). Dispatch is provider-driven and configured via env
 * (SMS_PROVIDER / WHATSAPP_PROVIDER, default 'console' = log-only demo driver).
 */
export class Reminders1729000000004 implements MigrationInterface {
  name = 'Reminders1729000000004';

  public async up(qr: QueryRunner): Promise<void> {
    // ─── TEMPLATES (editable message bodies) ─────────────────────────────────
    await qr.query(`
      CREATE TABLE notification_templates (
        id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        key         varchar(60) NOT NULL,
        channel     varchar(10) NOT NULL CHECK (channel IN ('sms','whatsapp')),
        name        varchar(120) NOT NULL,
        body        text NOT NULL,
        is_active   boolean NOT NULL DEFAULT true,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_notification_templates_clinic_key UNIQUE (clinic_id, key, channel)
      );
      CREATE INDEX idx_notification_templates_clinic ON notification_templates (clinic_id);
    `);

    // ─── OUTBOX (queued messages + delivery log) ─────────────────────────────
    await qr.query(`
      CREATE TABLE notifications (
        id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id           uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        patient_id          uuid REFERENCES patients (id) ON DELETE SET NULL,
        appointment_id      uuid REFERENCES appointments (id) ON DELETE SET NULL,
        template_key        varchar(60),
        channel             varchar(10) NOT NULL CHECK (channel IN ('sms','whatsapp')),
        recipient           varchar(50) NOT NULL,
        body                text NOT NULL,
        status              varchar(16) NOT NULL DEFAULT 'queued'
                            CHECK (status IN ('queued','sending','sent','failed','cancelled')),
        provider            varchar(20) NOT NULL DEFAULT 'console',
        provider_message_id varchar(120),
        error               text,
        attempts            integer NOT NULL DEFAULT 0,
        scheduled_at        timestamptz NOT NULL DEFAULT now(),
        sent_at             timestamptz,
        created_at          timestamptz NOT NULL DEFAULT now(),
        updated_at          timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_notifications_clinic_status  ON notifications (clinic_id, status, scheduled_at);
      CREATE INDEX idx_notifications_clinic_created ON notifications (clinic_id, created_at DESC);
      CREATE INDEX idx_notifications_appointment    ON notifications (clinic_id, appointment_id, template_key, channel);
    `);

    // ─── SETTINGS (one row per clinic) ───────────────────────────────────────
    await qr.query(`
      CREATE TABLE reminder_settings (
        clinic_id               uuid PRIMARY KEY REFERENCES clinics (id) ON DELETE CASCADE,
        appointment_reminders   boolean NOT NULL DEFAULT true,
        reminder_minutes_before integer NOT NULL DEFAULT 60,
        sms_enabled             boolean NOT NULL DEFAULT true,
        whatsapp_enabled        boolean NOT NULL DEFAULT true,
        quiet_hours_start       time,
        quiet_hours_end         time,
        max_attempts            integer NOT NULL DEFAULT 3,
        created_at              timestamptz NOT NULL DEFAULT now(),
        updated_at              timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_reminder_settings_minutes CHECK (reminder_minutes_before BETWEEN 1 AND 10080),
        CONSTRAINT ck_reminder_settings_attempts CHECK (max_attempts BETWEEN 1 AND 10)
      );
    `);

    // ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────
    for (const table of ['notification_templates', 'notifications', 'reminder_settings']) {
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
    await qr.query(`DROP TABLE IF EXISTS reminder_settings`);
    await qr.query(`DROP TABLE IF EXISTS notifications`);
    await qr.query(`DROP TABLE IF EXISTS notification_templates`);
  }
}
