/* Maintenance helper: list the demo patient roster or hard-delete one record.
 *
 * Handy while cleaning up demo data — deleting a patient cascades to their
 * appointments, visits, invoices, files, consents, etc.
 *
 * Usage (from apps/api):
 *   node scripts/patient-admin.cjs                    # list every patient
 *   node scripts/patient-admin.cjs delete PAT-0022    # hard delete one
 *
 * DATABASE_URL must be set in the environment.
 */
const { Client } = require('pg');

const CLINIC = 'ff21a0ba-41c7-4d7a-bbd5-c255b1cd8156';
const [command, argument] = process.argv.slice(2);
const target = command === 'delete' ? argument : null;

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [CLINIC]);

  if (!target) {
    const p = await c.query(
      `SELECT patient_number, first_name, last_name FROM patients
        WHERE clinic_id = $1 ORDER BY patient_number`,
      [CLINIC],
    );
    console.log('total: ' + p.rowCount);
    for (const r of p.rows) console.log(r.patient_number + ' | ' + r.first_name + ' ' + r.last_name);
    await c.end();
    return;
  }

  const before = await c.query(
    `SELECT p.id, p.first_name, p.last_name,
            (SELECT count(*) FROM appointments a WHERE a.patient_id = p.id)::int AS appts,
            (SELECT count(*) FROM visits v WHERE v.patient_id = p.id)::int AS visits,
            (SELECT count(*) FROM invoices i WHERE i.patient_id = p.id)::int AS invoices
       FROM patients p WHERE p.clinic_id = $1 AND p.patient_number = $2`,
    [CLINIC, target],
  );
  if (before.rowCount === 0) {
    console.log('no patient with number ' + target);
    await c.end();
    return;
  }
  const row = before.rows[0];
  console.log(
    `found ${target}: ${row.first_name} ${row.last_name} — ` +
      `${row.appts} appointments, ${row.visits} visits, ${row.invoices} invoices (all will cascade)`,
  );

  await c.query('BEGIN');
  const del = await c.query(
    `DELETE FROM patients WHERE clinic_id = $1 AND patient_number = $2 RETURNING id`,
    [CLINIC, target],
  );
  await c.query('COMMIT');

  const after = await c.query(`SELECT count(*)::int AS n FROM patients WHERE clinic_id = $1`, [CLINIC]);
  console.log(`deleted ${target}: ${del.rowCount} row(s). patients now: ${after.rows[0].n}`);
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
