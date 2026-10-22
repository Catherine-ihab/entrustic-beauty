/**
 * Verifies the dashboard aggregate SQL directly against the database, using the
 * exact query from DashboardService.counts(). This isolates SQL correctness from
 * the HTTP/test-harness plumbing.
 */
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const env = {};
for (const raw of fs.readFileSync(path.join(repoRoot, '.env.production'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  let v = line.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[line.slice(0, eq).trim()] = v;
}

const { Client } = require(path.join(repoRoot, 'node_modules', 'pg'));

const client = new Client({
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT || 5432),
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

(async () => {
  await client.connect();
  const [clinic] = (await client.query(`SELECT id, currency FROM clinics WHERE slug=$1`, ['entrustic-beauty'])).rows;
  const clinicId = clinic.id;

  const [row] = (
    await client.query(
      `
      SELECT
        (SELECT COUNT(*) FROM patients
          WHERE clinic_id = $1 AND deleted_at IS NULL)::int AS patients_total,
        (SELECT COUNT(*) FROM patients
          WHERE clinic_id = $1 AND deleted_at IS NULL AND status = 'active')::int AS patients_active,
        (SELECT COUNT(*) FROM patients
          WHERE clinic_id = $1 AND deleted_at IS NULL
            AND created_at >= date_trunc('month', now()))::int AS patients_new_this_month,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE)::int AS appt_today,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE
            AND status = 'completed')::int AS appt_today_completed,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE
            AND status IN ('scheduled','confirmed'))::int AS appt_today_remaining,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND status = 'in_progress')::int AS appt_in_progress,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time > now()
            AND status IN ('scheduled','confirmed'))::int AS appt_upcoming,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices
          WHERE clinic_id = $1 AND issue_date = CURRENT_DATE)::numeric(12,2) AS rev_today_collected,
        (SELECT COALESCE(SUM(total), 0) FROM invoices
          WHERE clinic_id = $1 AND issue_date = CURRENT_DATE)::numeric(12,2) AS rev_today_billed,
        (SELECT COALESCE(SUM(total - paid_amount), 0) FROM invoices
          WHERE clinic_id = $1 AND status IN ('issued','partially_paid','overdue'))::numeric(12,2) AS rev_today_pending,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices
          WHERE clinic_id = $1
            AND issue_date >= date_trunc('month', now()))::numeric(12,2) AS rev_month_collected
      `,
      [clinicId],
    )
  ).rows;

  console.log('COUNTS OK:');
  console.log(JSON.stringify(row, null, 1));

  const schedule = (
    await client.query(
      `
      SELECT a.start_time, p.first_name || ' ' || p.last_name AS patient_name,
             s.name AS service_name, u.first_name || ' ' || u.last_name AS provider_name, a.status
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN clinic_services s ON s.id = a.service_id
      LEFT JOIN users u ON u.id = a.provider_id
      WHERE a.clinic_id = $1 AND a.start_time::date = CURRENT_DATE
      ORDER BY a.start_time
      `,
      [clinicId],
    )
  ).rows;
  console.log('\nTODAY SCHEDULE:', schedule.length, 'rows');
  console.log(JSON.stringify(schedule, null, 1));

  const devices = (
    await client.query(
      `SELECT name, model, status, next_calibration FROM devices WHERE clinic_id=$1 ORDER BY name LIMIT 8`,
      [clinicId],
    )
  ).rows;
  console.log('\nDEVICES:', devices.length, JSON.stringify(devices.map((d) => d.name)));

  const low = (
    await client.query(
      `
      SELECT i.name, i.unit, i.reorder_level, COALESCE(SUM(b.quantity_remaining),0)::int AS remaining
      FROM inventory_items i
      LEFT JOIN inventory_batches b ON b.item_id = i.id
      WHERE i.clinic_id = $1 AND i.is_active = true
      GROUP BY i.id, i.name, i.unit, i.reorder_level
      HAVING COALESCE(SUM(b.quantity_remaining), 0) <= i.reorder_level
      ORDER BY remaining ASC LIMIT 6
      `,
      [clinicId],
    )
  ).rows;
  console.log('\nLOW STOCK:', low.length, JSON.stringify(low));

  await client.end();
})().catch((e) => {
  console.error('SQL CHECK FAILED:', e.message);
  process.exit(1);
});
