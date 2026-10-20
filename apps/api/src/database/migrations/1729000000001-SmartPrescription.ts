import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Smart E-Prescription tables (shared across all specialties):
 *   drugs                 — clinic drug catalog (brand, generic, substances for allergy/DDI matching)
 *   drug_interactions     — drug–drug interaction knowledge base (clinic-scoped for RLS consistency)
 *   prescriptions         — issued prescription header (patient, provider, visit)
 *   prescription_items    — line items (drug snapshot + dose/frequency/duration)
 *   doctor_favorite_drugs — per-doctor most-used drugs (1-click prescribing)
 *
 * All tables are tenant-scoped (clinic_id) with the same RLS pattern as the
 * rest of the platform (app.current_tenant_id).
 */
export class SmartPrescription1729000000001 implements MigrationInterface {
  name = 'SmartPrescription1729000000001';

  public async up(qr: QueryRunner): Promise<void> {
    // ─── DRUGS ─────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE drugs (
        id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id     uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        name          varchar(200) NOT NULL,
        generic_name  varchar(200),
        category      varchar(80),
        form          varchar(60),
        strength      varchar(60),
        substances    text[] NOT NULL DEFAULT '{}',
        common_doses  text,
        is_seed       boolean NOT NULL DEFAULT false,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_drugs_clinic_name UNIQUE (clinic_id, name)
      );
      CREATE INDEX idx_drugs_clinic ON drugs (clinic_id);
      CREATE INDEX idx_drugs_name ON drugs (name);
    `);

    // ─── DRUG-INTERACTIONS ─────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE drug_interactions (
        id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id  uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        drug_a_id  uuid NOT NULL REFERENCES drugs (id) ON DELETE CASCADE,
        drug_b_id  uuid NOT NULL REFERENCES drugs (id) ON DELETE CASCADE,
        severity   varchar(10) NOT NULL CHECK (severity IN ('minor','moderate','major')),
        advice     text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_drug_interactions_pair UNIQUE (clinic_id, drug_a_id, drug_b_id)
      );
      CREATE INDEX idx_drug_interactions_a ON drug_interactions (drug_a_id);
      CREATE INDEX idx_drug_interactions_b ON drug_interactions (drug_b_id);
    `);

    // ─── PRESCRIPTIONS ─────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE prescriptions (
        id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        patient_id  uuid NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
        visit_id    uuid REFERENCES visits (id) ON DELETE SET NULL,
        provider_id uuid REFERENCES users (id) ON DELETE SET NULL,
        issued_at   timestamptz NOT NULL DEFAULT now(),
        status      varchar(20) NOT NULL DEFAULT 'issued'
                    CHECK (status IN ('issued','printed','dispensed','cancelled')),
        notes       text,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_prescriptions_clinic_patient ON prescriptions (clinic_id, patient_id);
      CREATE INDEX idx_prescriptions_visit ON prescriptions (visit_id);
    `);

    // ─── PRESCRIPTION ITEMS ────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE prescription_items (
        id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        prescription_id uuid NOT NULL REFERENCES prescriptions (id) ON DELETE CASCADE,
        drug_id         uuid REFERENCES drugs (id) ON DELETE SET NULL,
        drug_name       varchar(200) NOT NULL,
        dose            varchar(120),
        frequency       varchar(120),
        duration        varchar(80),
        instructions    text,
        quantity        integer,
        sort_order      integer NOT NULL DEFAULT 0,
        created_at      timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_prescription_items_prescription ON prescription_items (prescription_id);
      CREATE INDEX idx_prescription_items_clinic ON prescription_items (clinic_id);
    `);

    // ─── DOCTOR FAVORITE DRUGS ─────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE doctor_favorite_drugs (
        id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id    uuid NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
        doctor_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        drug_id      uuid NOT NULL REFERENCES drugs (id) ON DELETE CASCADE,
        usage_count  integer NOT NULL DEFAULT 1,
        last_used_at timestamptz NOT NULL DEFAULT now(),
        created_at   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_favorite_drug UNIQUE (clinic_id, doctor_id, drug_id)
      );
      CREATE INDEX idx_favorite_drugs_doctor ON doctor_favorite_drugs (doctor_id);
    `);

    // ─── ROW-LEVEL SECURITY ────────────────────────────────────────────────
    for (const table of [
      'drugs',
      'drug_interactions',
      'prescriptions',
      'prescription_items',
      'doctor_favorite_drugs',
    ]) {
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
    await qr.query(`DROP TABLE IF EXISTS doctor_favorite_drugs`);
    await qr.query(`DROP TABLE IF EXISTS prescription_items`);
    await qr.query(`DROP TABLE IF EXISTS prescriptions`);
    await qr.query(`DROP TABLE IF EXISTS drug_interactions`);
    await qr.query(`DROP TABLE IF EXISTS drugs`);
  }
}