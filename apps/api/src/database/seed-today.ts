/**
 * Clinic Management Platform — "Operating Day" Demo Seeder
 *
 * The main demo seeder (seed-demo.ts) spreads appointments over the last month
 * and the next two weeks, but it deliberately skips Fridays — and it never
 * guarantees that *today* has anything on it. That leaves the dashboard with an
 * empty schedule and zeroed KPI cards ("لا توجد مواعيد اليوم"), which looks dead
 * in a demo.
 *
 * This script fills in a realistic operating day around the current clock time:
 *
 *   • 11 appointments today — completed / no-show / in-progress / confirmed /
 *     scheduled, positioned relative to "now" so the queue looks live
 *   • 5 invoices issued today (3 paid, 1 partially paid, 1 unpaid) so the
 *     revenue cards and the collections figure are non-zero
 *
 * It only ever touches TODAY, and it wipes today's rows before rebuilding, so
 * running it repeatedly is safe and always produces the same tidy scene.
 *
 * Usage:
 *   pnpm --filter @clinic/api demo:today
 */

import 'reflect-metadata';
import { AppDataSource } from './data-source';

const COMPLAINTS = [
  'متابعة جلسات الليزر — المنطقة الثانية',
  'جلسة Hydrafacial روتينية وتنظيف عميق',
  'متابعة بعد البوتوكس — تقييم النتيجة',
  'شكوى من جفاف البشرة بعد التقشير',
  'جلسة فيلر — مراجعة قبل الحقن',
  'تصبغات بالوجه — متابعة بعد شهر',
  'جلسة Morpheus8 — الجلسة الثالثة',
];

/**
 * The shape of the demo day, expressed as minutes relative to `now` (snapped to
 * the nearest half hour). Negative = already happened, positive = still coming.
 */
const PLAN: Array<{ minutes: number; status: string; invoice?: 'paid' | 'partial' | 'unpaid' }> = [
  { minutes: -240, status: 'completed', invoice: 'paid' },
  { minutes: -180, status: 'completed', invoice: 'paid' },
  { minutes: -150, status: 'no_show' },
  { minutes: -120, status: 'completed', invoice: 'partial' },
  { minutes: -90, status: 'completed', invoice: 'paid' },
  { minutes: -30, status: 'in_progress', invoice: 'paid' },
  { minutes: 45, status: 'confirmed' },
  { minutes: 105, status: 'confirmed' },
  { minutes: 165, status: 'confirmed' },
  { minutes: 225, status: 'scheduled' },
  { minutes: 285, status: 'scheduled' },
];

function snapToHalfHour(d: Date): Date {
  const out = new Date(d);
  out.setSeconds(0, 0);
  out.setMinutes(out.getMinutes() < 30 ? 0 : 30);
  return out;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function seedToday() {
  console.log('🌅 Filling today — appointments, queue and invoices...');
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ── 0. Clinic + reference data ─────────────────────────────────────────
    const slug = process.env.SEED_CLINIC_SLUG || 'entrustic-beauty';
    const [clinic] = await qr.query(`SELECT id, currency FROM clinics WHERE slug = $1`, [slug]);
    if (!clinic) throw new Error(`Clinic "${slug}" not found — run the base seed first.`);
    const clinicId: string = clinic.id;
    const currency: string = clinic.currency || 'EGP';

    await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [clinicId]);

    const staff: any[] = await qr.query(
      `SELECT id FROM users WHERE clinic_id = $1 AND deleted_at IS NULL ORDER BY created_at`,
      [clinicId],
    );
    if (staff.length === 0) throw new Error('No staff users found — run the base seed first.');
    const providers: string[] = staff.map((s) => s.id);

    const patients: any[] = await qr.query(
      `SELECT id, first_name, last_name, patient_number
         FROM patients
        WHERE clinic_id = $1 AND deleted_at IS NULL
        ORDER BY patient_number
        LIMIT 30`,
      [clinicId],
    );
    if (patients.length === 0) throw new Error('No patients found — run demo:seed first.');

    const services: any[] = await qr.query(
      `SELECT id, name, current_price, default_duration_minutes
         FROM clinic_services
        WHERE clinic_id = $1 AND is_active = true
        ORDER BY sort_order`,
      [clinicId],
    );
    if (services.length === 0) throw new Error('No services found — run the base seed first.');

    // ── 1. Clear today only ────────────────────────────────────────────────
    // Invoices carry no appointment_id, so they are matched by issue date.
    await qr.query(
      `DELETE FROM invoice_items
        WHERE invoice_id IN (
          SELECT id FROM invoices WHERE clinic_id = $1 AND issue_date = CURRENT_DATE
        )`,
      [clinicId],
    );
    const removedInvoices: any[] = await qr.query(
      `DELETE FROM invoices WHERE clinic_id = $1 AND issue_date = CURRENT_DATE RETURNING id`,
      [clinicId],
    );
    const removedAppointments: any[] = await qr.query(
      `DELETE FROM appointments WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE RETURNING id`,
      [clinicId],
    );
    console.log(
      `   ✓ cleared ${removedAppointments.length} appointments / ${removedInvoices.length} invoices from earlier runs`,
    );

    // ── 2. Appointments around "now" ───────────────────────────────────────
    const anchor = snapToHalfHour(new Date());
    const appointmentRows: Array<{
      id: string;
      patient: any;
      service: any;
      start: Date;
      status: string;
      invoice?: 'paid' | 'partial' | 'unpaid';
    }> = [];

    for (let i = 0; i < PLAN.length; i++) {
      const step = PLAN[i];
      const patient = patients[i % patients.length];
      const service = services[i % services.length];
      const provider = providers[i % providers.length];

      const start = new Date(anchor.getTime() + step.minutes * 60_000);
      const end = new Date(
        start.getTime() + (Number(service.default_duration_minutes) || 30) * 60_000,
      );

      const [row] = await qr.query(
        `INSERT INTO appointments
           (id, clinic_id, patient_id, provider_id, service_id, start_time, end_time,
            status, notes, cancellation_reason, visit_type, created_by, created_at, updated_at)
         VALUES (
           uuid_generate_v4(), $1, $2, $3, $4, $5, $6,
           $7, $8, $9, 'in_person', $3, $10, $10
         )
         RETURNING id`,
        [
          clinicId,
          patient.id,
          provider,
          service.id,
          start,
          end,
          step.status,
          i % 3 === 0 ? COMPLAINTS[i % COMPLAINTS.length] : null,
          step.status === 'no_show' ? 'لم تحضر — لم يتم التواصل' : null,
          new Date(start.getTime() - (2 + (i % 5)) * 86_400_000),
        ],
      );

      appointmentRows.push({ id: row.id, patient, service, start, status: step.status, invoice: step.invoice });
    }
    console.log(`   ✓ ${appointmentRows.length} appointments today (completed / no-show / in-progress / upcoming)`);

    // ── 3. Invoices for the consultations that already happened ────────────
    const [seqRow] = await qr.query(
      `SELECT current_value, prefix FROM tenant_sequences
        WHERE clinic_id = $1 AND sequence_type = 'INVOICE' FOR UPDATE`,
      [clinicId],
    );
    let seq = parseInt(seqRow?.current_value ?? '0', 10) || 0;
    const prefix: string = seqRow?.prefix || `INV-${new Date().getFullYear()}-`;

    let billed = 0;
    let collected = 0;
    let invoiceCount = 0;

    for (const appt of appointmentRows) {
      if (!appt.invoice) continue;

      seq++;
      const invoiceNumber = `${prefix}${String(seq).padStart(5, '0')}`;

      const unitPrice = Number(appt.service.current_price) || 500;
      const total = unitPrice;
      const paid =
        appt.invoice === 'paid'
          ? total
          : appt.invoice === 'partial'
            ? Math.round(total / 2)
            : 0;
      const status = paid === total ? 'paid' : paid > 0 ? 'partially_paid' : 'issued';

      const [inv] = await qr.query(
        `INSERT INTO invoices
           (id, clinic_id, patient_id, invoice_number, currency, issue_date, due_date,
            subtotal, discount_amount, tax_amount, total, paid_amount, status, notes, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9, $10, NULL, $11, $11)
         RETURNING id`,
        [
          clinicId,
          appt.patient.id,
          invoiceNumber,
          currency,
          isoDate(new Date()),
          isoDate(new Date(Date.now() + 14 * 86_400_000)),
          total,
          total,
          paid,
          status,
          new Date(),
        ],
      );

      await qr.query(
        `INSERT INTO invoice_items
           (id, clinic_id, invoice_id, service_id, description, unit_price, quantity, line_total)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 1, $5)`,
        [clinicId, inv.id, appt.service.id, appt.service.name, unitPrice],
      );

      invoiceCount++;
      billed += total;
      collected += paid;
    }

    await qr.query(
      `UPDATE tenant_sequences SET current_value = $2, updated_at = now()
        WHERE clinic_id = $1 AND sequence_type = 'INVOICE'`,
      [clinicId, String(seq)],
    );

    await qr.commitTransaction();

    const money = (n: number) => new Intl.NumberFormat('en-EG').format(n);
    console.log(`   ✓ ${invoiceCount} invoices issued today`);
    console.log(`   ✓ billed ${money(billed)} ${currency} / collected ${money(collected)} ${currency}`);
    console.log('\n✅ Today is ready — reload the dashboard.');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seedToday().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
