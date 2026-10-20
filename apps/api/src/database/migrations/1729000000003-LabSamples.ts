import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lab Samples & Results Tracking tables (shared across all specialties):
 *   lab_tests          — clinic lab test catalog (sample type, tube, reference range)
 *   lab_requests       — order header per patient (request no., priority, status)
 *   lab_request_items  — individual tests on a request with result entry
 *
 * All tables are tenant-scoped (clinic_id) with the same RLS pattern as the
 * rest of the platform (app.current_tenant_id). Lab request numbers reuse the
 * existing clinic sequence table via a new 'LAB' sequence_type enum value.
 */
export class LabSamples1729000000003 implements MigrationInterface {
  name = 'LabSamples1729000000003';

  public async up(qr: QueryRunner): Promise<void> {
    // Lab request numbers reuse tenant_sequences — extend the sequence type.
    await qr.query(`ALTER TYPE sequence_type_enum ADD VALUE IF NOT EXISTS 'LAB'`);

    // ─── LAB TESTS (catalog) ────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE lab_tests (
        id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id          uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        name               varchar(200) NOT NULL,
        category           varchar(80),
        sample_type        varchar(40),
        sample_tube        varchar(40),
        unit               varchar(40),
        reference_range    varchar(120),
        turnaround_hours   integer,
        is_active          boolean NOT NULL DEFAULT true,
        created_at         timestamptz NOT NULL DEFAULT now(),
        updated_at         timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_lab_tests_clinic_name UNIQUE (clinic_id, name)
      );
      CREATE INDEX idx_lab_tests_clinic ON lab_tests (clinic_id);
      CREATE INDEX idx_lab_tests_category ON lab_tests (clinic_id, category);
    `);

    // ─── LAB REQUESTS (order header) ─────────────────────────────────────────
    await qr.query(`
      CREATE TABLE lab_requests (
        id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        patient_id      uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
        visit_id        uuid REFERENCES visits (id) ON DELETE SET NULL,
        request_number  varchar(30) NOT NULL,
        requested_by    uuid REFERENCES users (id) ON DELETE SET NULL,
        status          varchar(20) NOT NULL DEFAULT 'ordered'
                        CHECK (status IN ('ordered','collected','in_progress','completed','cancelled')),
        priority        varchar(10) NOT NULL DEFAULT 'routine'
                        CHECK (priority IN ('routine','urgent','stat')),
        clinical_notes  text,
        collected_at    timestamptz,
        collected_by    uuid REFERENCES users (id) ON DELETE SET NULL,
        lab_technician  uuid REFERENCES users (id) ON DELETE SET NULL,
        completed_at    timestamptz,
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_lab_requests_clinic_number UNIQUE (clinic_id, request_number)
      );
      CREATE INDEX idx_lab_requests_clinic ON lab_requests (clinic_id);
      CREATE INDEX idx_lab_requests_patient ON lab_requests (clinic_id, patient_id);
      CREATE INDEX idx_lab_requests_status ON lab_requests (clinic_id, status);
    `);

    // ─── LAB REQUEST ITEMS (tests on a request + results) ────────────────────
    await qr.query(`
      CREATE TABLE lab_request_items (
        id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        request_id      uuid NOT NULL REFERENCES lab_requests (id) ON DELETE CASCADE,
        test_id         uuid NOT NULL REFERENCES lab_tests (id) ON DELETE CASCADE,
        status          varchar(20) NOT NULL DEFAULT 'ordered'
                        CHECK (status IN ('ordered','collected','in_progress','completed','cancelled')),
        result_value    varchar(80),
        result_unit     varchar(40),
        result_flag     varchar(10)
                        CHECK (result_flag IN ('low','normal','high')),
        result_notes    text,
        resulted_by     uuid REFERENCES users (id) ON DELETE SET NULL,
        resulted_at     timestamptz,
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_lab_request_items_req_test UNIQUE (request_id, test_id)
      );
      CREATE INDEX idx_lab_request_items_request ON lab_request_items (clinic_id, request_id);
      CREATE INDEX idx_lab_request_items_test ON lab_request_items (clinic_id, test_id);
    `);

    // ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────
    for (const table of ['lab_tests', 'lab_requests', 'lab_request_items']) {
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
    await qr.query(`DROP TABLE IF EXISTS lab_request_items`);
    await qr.query(`DROP TABLE IF EXISTS lab_requests`);
    await qr.query(`DROP TABLE IF EXISTS lab_tests`);
  }
}