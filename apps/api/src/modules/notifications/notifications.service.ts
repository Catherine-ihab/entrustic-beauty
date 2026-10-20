import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { NotificationTemplate } from './entities/notification-template.entity';
import { resolveProvider, MessagingProvider } from './messaging.provider';
import {
  INotification,
  INotificationTemplate,
  IReminderSettings,
  NotificationChannel,
  RunDueResult,
  SendNotificationDto,
  UpdateNotificationTemplateDto,
  UpdateReminderSettingsDto,
} from '@clinic/shared-types';

const REMINDER_KEY = 'appointment_reminder';

const NOTIFICATION_STATUSES = ['queued', 'sending', 'sent', 'failed', 'cancelled'];

const DEFAULT_REMINDER_BODIES: Record<NotificationChannel, string> = {
  sms: 'Hi {{patient_name}}, reminder of your appointment at {{clinic_name}} on {{date}} at {{time}}. Call us if you need to reschedule.',
  whatsapp:
    'Hi {{patient_name}}, this is a reminder of your appointment at {{clinic_name}} on {{date}} at {{time}}. Reply to this message if you need to reschedule.',
};

interface ClaimedRow {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  body: string;
  attempts: number;
}

interface DispatchOutcome {
  provider: string;
  providerMessageId: string | null;
  error: string | null;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    private readonly dataSource: DataSource,
    private readonly tenantTx: TenantTransactionManager,
  ) {}

  // ─── BACKGROUND SWEEP ─────────────────────────────────────────────────────

  onModuleInit() {
    const intervalMs = Number(process.env.REMINDER_SWEEP_INTERVAL_MS ?? 60000);
    if (Number.isFinite(intervalMs) && intervalMs > 0) {
      this.sweepTimer = setInterval(() => {
        void this.sweepAllClinics();
      }, intervalMs);
      this.sweepTimer.unref?.();
      this.logger.log(`Reminder sweep running every ${intervalMs} ms`);
    }
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /** Background sweep across every active clinic (no CLS — tenant set per transaction). */
  private async sweepAllClinics(): Promise<void> {
    try {
      const clinics: any[] = await this.dataSource.query(
        `SELECT id FROM clinics WHERE status IN ('trial','active') ORDER BY id`,
      );
      for (const c of clinics) {
        try {
          await this.runDue(c.id);
        } catch (err) {
          this.logger.error(`Sweep failed for clinic ${c.id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Sweep could not list clinics: ${(err as Error).message}`);
    }
  }

  /**
   * Transactional work with an explicitly-set tenant. Used by the sweep pipeline
   * (and the run-due endpoint) where no CLS request context exists.
   */
  private async runWithClinic<T>(
    clinicId: string,
    work: (qr: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [clinicId]);
      const result = await work(qr);
      await qr.commitTransaction();
      return result;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ─── TEMPLATES ────────────────────────────────────────────────────────────

  async listTemplates(clinicId: string, q?: string): Promise<INotificationTemplate[]> {
    let sql = `SELECT id, key, channel, name, body, is_active AS "isActive"
               FROM notification_templates WHERE clinic_id = $1`;
    const params: Array<string> = [clinicId];
    if (q && q.trim()) {
      sql += ` AND (name ILIKE $${params.length + 1} OR key ILIKE $${params.length + 1})`;
      params.push(`%${q.trim()}%`);
    }
    sql += ` ORDER BY key ASC, channel ASC`;
    const rows: any[] = await this.dataSource.query(sql, params);
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      channel: r.channel,
      name: r.name,
      body: r.body,
      isActive: r.isActive,
    }));
  }

  async updateTemplate(
    clinicId: string,
    id: string,
    dto: UpdateNotificationTemplateDto,
  ): Promise<INotificationTemplate> {
    const tpl = await this.templateRepo.findOne({ where: { id, clinic_id: clinicId } });
    if (!tpl) {
      throw new NotFoundException('Notification template not found');
    }
    if (dto.name !== undefined) {
      if (!dto.name.trim()) throw new BadRequestException('Template name cannot be empty');
      tpl.name = dto.name.trim();
    }
    if (dto.body !== undefined) {
      if (!dto.body.trim()) throw new BadRequestException('Template body cannot be empty');
      tpl.body = dto.body.trim();
    }
    if (dto.isActive !== undefined) tpl.is_active = dto.isActive;
    const saved = await this.templateRepo.save(tpl);
    return {
      id: saved.id,
      key: saved.key,
      channel: saved.channel,
      name: saved.name,
      body: saved.body,
      isActive: saved.is_active,
    };
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────

  async getSettings(clinicId: string): Promise<IReminderSettings> {
    const settings = await this.runWithClinic(clinicId, (qr) =>
      this.loadSettings(qr, clinicId),
    );
    return this.mapSettings(settings);
  }

  async updateSettings(
    clinicId: string,
    dto: UpdateReminderSettingsDto,
  ): Promise<IReminderSettings> {
    if (
      dto.reminderMinutesBefore !== undefined &&
      (dto.reminderMinutesBefore < 1 || dto.reminderMinutesBefore > 10080)
    ) {
      throw new BadRequestException('reminderMinutesBefore must be between 1 and 10080');
    }
    if (dto.maxAttempts !== undefined && (dto.maxAttempts < 1 || dto.maxAttempts > 10)) {
      throw new BadRequestException('maxAttempts must be between 1 and 10');
    }

    const touchQuiet =
      dto.quietHoursStart !== undefined || dto.quietHoursEnd !== undefined;
    if (touchQuiet && (dto.quietHoursStart === undefined || dto.quietHoursEnd === undefined)) {
      throw new BadRequestException(
        'quietHoursStart and quietHoursEnd must be provided together',
      );
    }
    if (touchQuiet && dto.quietHoursStart !== null && dto.quietHoursStart === dto.quietHoursEnd) {
      throw new BadRequestException('Quiet hours window cannot be empty');
    }

    return this.tenantTx.runWithTenant(async (qr) => {
      await this.loadSettings(qr, clinicId);

      const cols: string[] = [];
      const params: Array<string | number | boolean | null> = [clinicId];
      const push = (col: string, val: string | number | boolean | null) => {
        params.push(val);
        cols.push(`${col} = $${params.length}`);
      };
      if (dto.appointmentReminders !== undefined) push('appointment_reminders', dto.appointmentReminders);
      if (dto.reminderMinutesBefore !== undefined) push('reminder_minutes_before', dto.reminderMinutesBefore);
      if (dto.smsEnabled !== undefined) push('sms_enabled', dto.smsEnabled);
      if (dto.whatsappEnabled !== undefined) push('whatsapp_enabled', dto.whatsappEnabled);
      if (touchQuiet) {
        push('quiet_hours_start', dto.quietHoursStart ?? null);
        push('quiet_hours_end', dto.quietHoursEnd ?? null);
      }
      if (dto.maxAttempts !== undefined) push('max_attempts', dto.maxAttempts);

      if (cols.length > 0) {
        await qr.query(
          `UPDATE reminder_settings SET ${cols.join(', ')}, updated_at = now()
           WHERE clinic_id = $1`,
          params,
        );
      }

      const settings = await this.loadSettings(qr, clinicId);
      return this.mapSettings(settings);
    });
  }

  private async loadSettings(qr: QueryRunner, clinicId: string): Promise<any> {
    let [s] = await qr.query(`SELECT * FROM reminder_settings WHERE clinic_id = $1`, [
      clinicId,
    ]);
    if (!s) {
      [s] = await qr.query(
        `INSERT INTO reminder_settings (clinic_id) VALUES ($1)
         ON CONFLICT (clinic_id) DO UPDATE SET updated_at = reminder_settings.updated_at
         RETURNING *`,
        [clinicId],
      );
    }
    return s;
  }

  private mapSettings(s: any): IReminderSettings {
    return {
      appointmentReminders: s.appointment_reminders,
      reminderMinutesBefore: s.reminder_minutes_before,
      smsEnabled: s.sms_enabled,
      whatsappEnabled: s.whatsapp_enabled,
      quietHoursStart: s.quiet_hours_start ?? undefined,
      quietHoursEnd: s.quiet_hours_end ?? undefined,
      maxAttempts: s.max_attempts,
    };
  }

  // ─── OUTBOX ───────────────────────────────────────────────────────────────

  async listNotifications(
    clinicId: string,
    status?: string,
    channel?: string,
    q?: string,
  ): Promise<INotification[]> {
    let sql = `
      SELECT n.id, n.patient_id AS "patientId", n.appointment_id AS "appointmentId",
             n.template_key AS "templateKey", n.channel, n.recipient, n.body, n.status,
             n.provider, n.provider_message_id AS "providerMessageId", n.error,
             n.attempts, n.scheduled_at AS "scheduledAt", n.sent_at AS "sentAt",
             n.created_at AS "createdAt",
             p.first_name || ' ' || p.last_name AS "patientName",
             p.patient_number AS "patientNumber",
             a.start_time AS "appointmentTime"
      FROM notifications n
      LEFT JOIN patients p ON p.id = n.patient_id
      LEFT JOIN appointments a ON a.id = n.appointment_id
      WHERE n.clinic_id = $1`;
    const params: Array<string> = [clinicId];

    if (status && NOTIFICATION_STATUSES.includes(status)) {
      sql += ` AND n.status = $${params.length + 1}`;
      params.push(status);
    }
    if (channel === 'sms' || channel === 'whatsapp') {
      sql += ` AND n.channel = $${params.length + 1}`;
      params.push(channel);
    }
    if (q && q.trim()) {
      const pattern = `%${q.trim()}%`;
      sql += ` AND (n.recipient ILIKE $${params.length + 1}
              OR n.body ILIKE $${params.length + 1}
              OR COALESCE(p.first_name, '') ILIKE $${params.length + 1}
              OR COALESCE(p.last_name, '') ILIKE $${params.length + 1}
              OR COALESCE(p.patient_number, '') ILIKE $${params.length + 1})`;
      params.push(pattern);
    }
    sql += ` ORDER BY n.created_at DESC LIMIT 200`;

    const rows: any[] = await this.dataSource.query(sql, params);
    return rows.map((r) => this.mapNotification(r));
  }

  async getNotification(clinicId: string, id: string): Promise<INotification> {
    const [r] = await this.dataSource.query(
      `SELECT n.id, n.patient_id AS "patientId", n.appointment_id AS "appointmentId",
              n.template_key AS "templateKey", n.channel, n.recipient, n.body, n.status,
              n.provider, n.provider_message_id AS "providerMessageId", n.error,
              n.attempts, n.scheduled_at AS "scheduledAt", n.sent_at AS "sentAt",
              n.created_at AS "createdAt",
              p.first_name || ' ' || p.last_name AS "patientName",
              p.patient_number AS "patientNumber",
              a.start_time AS "appointmentTime"
       FROM notifications n
       LEFT JOIN patients p ON p.id = n.patient_id
       LEFT JOIN appointments a ON a.id = n.appointment_id
       WHERE n.clinic_id = $1 AND n.id = $2`,
      [clinicId, id],
    );
    if (!r) throw new NotFoundException('Notification not found');
    return this.mapNotification(r);
  }

  private mapNotification(r: any): INotification {
    return {
      id: r.id,
      patientId: r.patientId ?? undefined,
      patientName: r.patientName ?? undefined,
      patientNumber: r.patientNumber ?? undefined,
      appointmentId: r.appointmentId ?? undefined,
      appointmentTime: r.appointmentTime ? new Date(r.appointmentTime).toISOString() : undefined,
      templateKey: r.templateKey ?? undefined,
      channel: r.channel,
      recipient: r.recipient,
      body: r.body,
      status: r.status,
      provider: r.provider,
      providerMessageId: r.providerMessageId ?? undefined,
      error: r.error ?? undefined,
      attempts: r.attempts,
      scheduledAt: new Date(r.scheduledAt).toISOString(),
      sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : undefined,
      createdAt: new Date(r.createdAt).toISOString(),
    };
  }

  // ─── MANUAL SEND / RETRY / CANCEL ─────────────────────────────────────────

  async manualSend(
    clinicId: string,
    dto: SendNotificationDto,
  ): Promise<INotification> {
    if (!dto.patientId) throw new BadRequestException('patientId is required');
    if (dto.channel !== 'sms' && dto.channel !== 'whatsapp') {
      throw new BadRequestException("channel must be 'sms' or 'whatsapp'");
    }
    const body = dto.body?.trim();
    if (!body) throw new BadRequestException('body is required');
    if (body.length > 1000) throw new BadRequestException('body is too long (max 1000 characters)');

    const createdId: string = await this.tenantTx.runWithTenant(async (qr) => {
      const [patient] = await qr.query(
        `SELECT id, phone FROM patients
         WHERE clinic_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [clinicId, dto.patientId],
      );
      if (!patient) throw new BadRequestException('Patient not found');
      if (!patient.phone?.trim()) {
        throw new BadRequestException('Patient has no phone number on file');
      }
      const [row] = await qr.query(
        `INSERT INTO notifications
           (id, clinic_id, patient_id, template_key, channel, recipient, body, status, scheduled_at)
         VALUES (uuid_generate_v4(), $1, $2, NULL, $3, $4, $5, 'queued', now())
         RETURNING id`,
        [clinicId, dto.patientId, dto.channel, patient.phone.trim(), body],
      );
      return row.id;
    });

    // Manual sends dispatch immediately (quiet hours apply to the sweep only).
    return this.claimDispatchAndReturn(clinicId, createdId);
  }

  async retry(clinicId: string, id: string): Promise<INotification> {
    await this.tenantTx.runWithTenant(async (qr) => {
      const [row] = await qr.query(
        `SELECT status FROM notifications WHERE clinic_id = $1 AND id = $2`,
        [clinicId, id],
      );
      if (!row) throw new NotFoundException('Notification not found');
      if (row.status === 'sent') throw new BadRequestException('Message was already sent');
      if (row.status === 'sending') throw new BadRequestException('Message is currently being sent');
      await qr.query(
        `UPDATE notifications
         SET status = 'queued', attempts = 0, error = NULL, sent_at = NULL,
             provider_message_id = NULL, scheduled_at = now(), updated_at = now()
         WHERE clinic_id = $1 AND id = $2`,
        [clinicId, id],
      );
    });
    return this.claimDispatchAndReturn(clinicId, id);
  }

  async cancel(clinicId: string, id: string): Promise<INotification> {
    await this.tenantTx.runWithTenant(async (qr) => {
      const [row] = await qr.query(
        `SELECT status FROM notifications WHERE clinic_id = $1 AND id = $2`,
        [clinicId, id],
      );
      if (!row) throw new NotFoundException('Notification not found');
      if (row.status === 'sent') {
        throw new BadRequestException('A sent message cannot be cancelled');
      }
      if (row.status === 'cancelled') return;
      await qr.query(
        `UPDATE notifications SET status = 'cancelled', updated_at = now()
         WHERE clinic_id = $1 AND id = $2`,
        [clinicId, id],
      );
    });
    return this.getNotification(clinicId, id);
  }

  /**
   * TypeORM's `queryRunner.query()` returns `[rows, rowCount]` for UPDATE
   * commands (INSERT/SELECT return `rows` directly) — unwrap accordingly.
   */
  private updateRows<T = any>(raw: any): T[] {
    if (Array.isArray(raw) && raw.length === 2 && Array.isArray(raw[0])) {
      return raw[0] as T[];
    }
    return Array.isArray(raw) ? (raw as T[]) : [];
  }

  /** Claim one queued row, dispatch it, persist the outcome, return the fresh row. */
  private async claimDispatchAndReturn(clinicId: string, id: string): Promise<INotification> {
    const claimed: ClaimedRow | null = await this.tenantTx.runWithTenant(async (qr) => {
      const raw = await qr.query(
        `UPDATE notifications
         SET status = 'sending', attempts = attempts + 1, updated_at = now()
         WHERE clinic_id = $1 AND id = $2 AND status = 'queued'
         RETURNING id, channel, recipient, body, attempts`,
        [clinicId, id],
      );
      return this.updateRows<ClaimedRow>(raw)[0] ?? null;
    });

    if (claimed) {
      const settings = await this.tenantTx.runWithTenant((qr) =>
        this.loadSettings(qr, clinicId),
      );
      const outcome = await this.dispatch(claimed);
      await this.tenantTx.runWithTenant((qr) =>
        this.persistOutcome(qr, clinicId, claimed, outcome, settings),
      );
    }
    return this.getNotification(clinicId, id);
  }

  // ─── SWEEP PIPELINE (enqueue → claim → dispatch → persist) ────────────────

  /**
   * Enqueue appointment reminders that are due, then dispatch everything whose
   * scheduled time has arrived. Safe to call concurrently — claiming is atomic.
   */
  async runDue(clinicId: string): Promise<RunDueResult> {
    const settings = await this.runWithClinic(clinicId, (qr) =>
      this.loadSettings(qr, clinicId),
    );

    const queued = settings.appointment_reminders
      ? await this.runWithClinic(clinicId, (qr) =>
          this.enqueueReminders(qr, clinicId, settings),
        )
      : 0;

    const due: ClaimedRow[] = await this.runWithClinic(clinicId, (qr) =>
      this.claimDue(qr, clinicId, settings),
    );

    let sent = 0;
    let failed = 0;
    for (const row of due) {
      const outcome = await this.dispatch(row);
      await this.runWithClinic(clinicId, (qr) =>
        this.persistOutcome(qr, clinicId, row, outcome, settings),
      );
      if (outcome.error === null) sent++;
      else failed++;
    }
    return { queued, sent, failed };
  }

  private async enqueueReminders(
    qr: QueryRunner,
    clinicId: string,
    settings: any,
  ): Promise<number> {
    const channels: NotificationChannel[] = [];
    if (settings.sms_enabled) channels.push('sms');
    if (settings.whatsapp_enabled) channels.push('whatsapp');

    let queued = 0;
    for (const channel of channels) {
      const rows: any[] = await qr.query(
        `SELECT a.id AS appointment_id, a.patient_id, a.start_time,
                p.phone AS recipient, p.first_name, p.last_name, c.name AS clinic_name
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id AND p.deleted_at IS NULL
         JOIN clinics  c ON c.id = a.clinic_id
         WHERE a.clinic_id = $1
           AND a.status IN ('scheduled','confirmed')
           AND a.start_time > now()
           AND a.start_time <= now() + make_interval(mins => $2::int)
           AND p.phone IS NOT NULL AND p.phone <> ''
           AND NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.clinic_id = a.clinic_id
               AND n.appointment_id = a.id
               AND n.template_key = $3
               AND n.channel = $4
           )
         ORDER BY a.start_time
         LIMIT 50`,
        [clinicId, settings.reminder_minutes_before, REMINDER_KEY, channel],
      );

      for (const r of rows) {
        const body = await this.renderReminder(qr, clinicId, channel, r);
        await qr.query(
          `INSERT INTO notifications
             (id, clinic_id, patient_id, appointment_id, template_key, channel, recipient, body, status, scheduled_at)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 'queued', now())`,
          [
            clinicId,
            r.patient_id,
            r.appointment_id,
            REMINDER_KEY,
            channel,
            r.recipient,
            body,
          ],
        );
        queued++;
      }
    }
    return queued;
  }

  private async renderReminder(
    qr: QueryRunner,
    clinicId: string,
    channel: NotificationChannel,
    appt: any,
  ): Promise<string> {
    const [tpl] = await qr.query(
      `SELECT body FROM notification_templates
       WHERE clinic_id = $1 AND key = $2 AND channel = $3 AND is_active = true`,
      [clinicId, REMINDER_KEY, channel],
    );
    const template: string = tpl?.body || DEFAULT_REMINDER_BODIES[channel];

    const d = new Date(appt.start_time);
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const patientName =
      `${appt.first_name ?? ''} ${appt.last_name ?? ''}`.trim() || 'there';

    return template
      .replace(/\{\{patient_name\}\}/g, patientName)
      .replace(/\{\{clinic_name\}\}/g, appt.clinic_name ?? '')
      .replace(/\{\{date\}\}/g, date)
      .replace(/\{\{time\}\}/g, time);
  }

  /** Atomically claim due queued rows (respecting attempts budget + quiet hours). */
  private async claimDue(
    qr: QueryRunner,
    clinicId: string,
    settings: any,
  ): Promise<ClaimedRow[]> {
    const raw = await qr.query(
      `UPDATE notifications n
       SET status = 'sending', attempts = n.attempts + 1, updated_at = now()
       WHERE n.clinic_id = $1
         AND n.status = 'queued'
         AND n.scheduled_at <= now()
         AND n.attempts < $2::int
         AND (
           $3::time IS NULL OR $4::time IS NULL
           OR CASE
                WHEN $3::time <= $4::time
                  THEN NOT (now()::time >= $3::time AND now()::time < $4::time)
                ELSE NOT (now()::time >= $3::time OR now()::time < $4::time)
              END
         )
       RETURNING n.id, n.channel, n.recipient, n.body, n.attempts`,
      [
        clinicId,
        settings.max_attempts,
        settings.quiet_hours_start ?? null,
        settings.quiet_hours_end ?? null,
      ],
    );
    return this.updateRows<ClaimedRow>(raw);
  }

  /** Network dispatch — runs outside any DB transaction. */
  private async dispatch(row: ClaimedRow): Promise<DispatchOutcome> {
    let provider: MessagingProvider | null = null;
    try {
      provider = resolveProvider(row.channel);
      const res = await provider.send({ to: row.recipient, body: row.body, channel: row.channel });
      return {
        provider: provider.name,
        providerMessageId: res.providerMessageId ?? null,
        error: null,
      };
    } catch (err) {
      return {
        provider: provider?.name ?? 'unknown',
        providerMessageId: null,
        error: (err as Error).message.slice(0, 500),
      };
    }
  }

  private async persistOutcome(
    qr: QueryRunner,
    clinicId: string,
    row: ClaimedRow,
    outcome: DispatchOutcome,
    settings: any,
  ): Promise<void> {
    if (outcome.error === null) {
      await qr.query(
        `UPDATE notifications
         SET status = 'sent', provider = $3, provider_message_id = $4,
             sent_at = now(), error = NULL, updated_at = now()
         WHERE clinic_id = $1 AND id = $2`,
        [clinicId, row.id, outcome.provider, outcome.providerMessageId],
      );
      return;
    }

    if (row.attempts >= settings.max_attempts) {
      // Budget exhausted — park the row as failed for a manual retry.
      await qr.query(
        `UPDATE notifications
         SET status = 'failed', provider = $3, error = $4, updated_at = now()
         WHERE clinic_id = $1 AND id = $2`,
        [clinicId, row.id, outcome.provider, outcome.error],
      );
    } else {
      // Keep it queued with a short backoff so the next sweep retries it.
      await qr.query(
        `UPDATE notifications
         SET status = 'queued', provider = $3, error = $4,
             scheduled_at = now() + interval '5 minutes', updated_at = now()
         WHERE clinic_id = $1 AND id = $2`,
        [clinicId, row.id, outcome.provider, outcome.error],
      );
    }
  }
}
