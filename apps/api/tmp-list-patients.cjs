const { Client } = require('pg');
const url = process.env.DATABASE_URL;
(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const p = await c.query(SELECT id, patient_number, first_name, last_name, email, phone, date_of_birth, gender, status, created_at, deleted_at
     FROM patients WHERE clinic_id='ff21a0ba-41c7-4d7a-bbd5-c255b1cd8156' ORDER BY patient_number);
  for (const r of p.rows) {
    console.log([r.patient_number, r.first_name + ' ' + r.last_name, r.email, r.status, r.deleted_at ? 'DELETED' : ''].join(' | '));
  }
  await c.end();
})();
