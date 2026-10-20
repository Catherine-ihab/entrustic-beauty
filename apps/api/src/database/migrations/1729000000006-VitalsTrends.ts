import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase A6 — Vitals Trends (shared across all specialties):
 *   visit_measurements.visit_id — nullable, so standalone readings recorded at
 *                                 a nurse station are not forced onto a visit
 *   + time-range index for trend queries (clinic, patient, recorded_at)
 *   + tenant RLS — the table predates the tenant-RLS sweep in InitialSchema and
 *     was never covered; trends now expose it to the patient portal as well.
 *
 * The existing (clinic_id, patient_id, key) index still serves per-key lookups.
 */
export class VitalsTrends1729000000006 implements MigrationInterface {
  name = 'VitalsTrends1729000000006';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE visit_measurements ALTER COLUMN visit_id DROP NOT NULL
    `);
    await qr.query(`
      CREATE INDEX idx_visit_measurements_patient_time
        ON visit_measurements (clinic_id, patient_id, recorded_at)
    `);
    await qr.query(`ALTER TABLE visit_measurements ENABLE ROW LEVEL SECURITY`);
    await qr.query(`ALTER TABLE visit_measurements FORCE ROW LEVEL SECURITY`);
    await qr.query(`
      CREATE POLICY tenant_isolation ON visit_measurements
        USING (clinic_id::text = current_setting('app.current_tenant_id', true))
        WITH CHECK (clinic_id::text = current_setting('app.current_tenant_id', true))
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP POLICY IF EXISTS tenant_isolation ON visit_measurements`);
    await qr.query(`ALTER TABLE visit_measurements DISABLE ROW LEVEL SECURITY`);
    await qr.query(`DROP INDEX IF EXISTS idx_visit_measurements_patient_time`);
    // NOT NULL can only come back once standalone readings are gone.
    await qr.query(`DELETE FROM visit_measurements WHERE visit_id IS NULL`);
    await qr.query(`ALTER TABLE visit_measurements ALTER COLUMN visit_id SET NOT NULL`);
  }
}
