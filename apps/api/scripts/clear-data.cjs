#!/usr/bin/env node
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.production') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 5432),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const OPERATIONAL_TABLES = [
  'queue_entries',
  'audit_logs',
  'inventory_movements',
  'inventory_batches',
  'inventory_items',
  'invoice_items',
  'invoices',
  'prescription_items',
  'prescriptions',
  'lab_request_items',
  'lab_requests',
  'appointment_versions',
  'appointments',
  'consent_records',
  'patient_files',
  'patient_allergies',
  'patient_conditions',
  'patient_medications',
  'family_history',
  'before_after_images',
  'before_after_records',
  'visits',
  'patients',
  'clinic_service_pricing',
  'clinic_services',
  'packages',
  'package_sessions',
  'notifications',
];

(async () => {
  const client = new Client(connection);
  await client.connect();
  try {
    for (const t of OPERATIONAL_TABLES) {
      try {
        await client.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE;`);
        console.log('cleared:', t);
      } catch (e) {
        console.log('skip:', t, '-', e.message.split('\n')[0]);
      }
    }
    console.log('DONE: operational data cleared');
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
