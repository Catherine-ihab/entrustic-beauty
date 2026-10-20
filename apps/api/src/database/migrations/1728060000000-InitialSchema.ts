import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial migration — creates all tables for the Clinic Management Platform.
 *
 * Table creation order respects FK dependencies:
 *   clinics → clinic_branding, clinic_modules
 *   roles → permissions, role_permissions
 *   users → (references clinics, roles)
 *   patients → (references clinics)
 *   clinic_services → (references clinics)
 *   tenant_sequences → (references clinics)
 *   appointments → (references clinics, patients, clinic_services, users)
 *   visits → (references clinics, patients, appointments, users)
 *   visit_versions → (references clinics, visits, users)
 *   invoices → (references clinics, patients)
 *   invoice_items → (references invoices, clinic_services)
 *   before_after_records → (references clinics, patients)
 *   before_after_images → (references before_after_records)
 *   audit_logs → (references clinics)
 *
 * Row-Level Security is applied to every tenant-scoped table using
 *   app.current_tenant_id — set per-transaction by TenantTransactionManager.
 */
export class InitialSchema1728060000000 implements MigrationInterface {
  name = 'InitialSchema1728060000000';

  public async up(qr: QueryRunner): Promise<void> {
    // ─── ENUMS ──────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TYPE clinic_status_enum AS ENUM ('trial','active','suspended','deactivated');
      CREATE TYPE user_status_enum AS ENUM ('active','inactive','locked','pending');
      CREATE TYPE appointment_status_enum AS ENUM ('scheduled','confirmed','in_progress','completed','cancelled','no_show');
      CREATE TYPE invoice_status_enum AS ENUM ('draft','issued','partially_paid','paid','overdue','cancelled','refunded');
      CREATE TYPE payment_method_enum AS ENUM ('cash','card','bank_transfer','insurance','other');
      CREATE TYPE visit_status_enum AS ENUM ('draft','finalized','amended','archived','voided');
      CREATE TYPE sequence_type_enum AS ENUM ('PATIENT','INVOICE');
      CREATE TYPE gender_enum AS ENUM ('male','female','other','unspecified');
      CREATE TYPE patient_status_enum AS ENUM ('active','inactive','archived');
      CREATE TYPE before_after_image_type_enum AS ENUM ('before','after');
    `);

    // ─── CLINICS ────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE clinics (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(255) NOT NULL,
        slug          VARCHAR(100) NOT NULL UNIQUE,
        clinic_type   VARCHAR(50) NOT NULL DEFAULT 'general_medical',
        specialties   TEXT,
        status        clinic_status_enum NOT NULL DEFAULT 'trial',
        country       VARCHAR(100),
        phone         VARCHAR(50),
        email         VARCHAR(255),
        address       TEXT,
        timezone      VARCHAR(100) NOT NULL DEFAULT 'UTC',
        currency      VARCHAR(10)  NOT NULL DEFAULT 'USD',
        default_language VARCHAR(10) NOT NULL DEFAULT 'en',
        subscription_plan VARCHAR(100),
        trial_ends_at TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_clinics_slug ON clinics(slug);
    `);

    // ─── CLINIC BRANDING ────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE clinic_branding (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
        logo_url        TEXT,
        favicon_url     TEXT,
        primary_color   VARCHAR(20) DEFAULT '#1890ff',
        secondary_color VARCHAR(20),
        welcome_message TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // ─── CLINIC MODULES ─────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE clinic_modules (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        module_key  VARCHAR(100) NOT NULL,
        is_enabled  BOOLEAN NOT NULL DEFAULT true,
        config      JSONB NOT NULL DEFAULT '{}',
        enabled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(clinic_id, module_key)
      );
      CREATE INDEX idx_clinic_modules_clinic ON clinic_modules(clinic_id);
    `);

    // ─── ROLES ──────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE roles (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE,
        name        VARCHAR(100) NOT NULL,
        display_name VARCHAR(255) NOT NULL DEFAULT '',
        description TEXT,
        is_system   BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(clinic_id, name)
      );
      CREATE INDEX idx_roles_clinic ON roles(clinic_id);
    `);

    // ─── PERMISSIONS ────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE permissions (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key         VARCHAR(150) NOT NULL UNIQUE,
        resource    VARCHAR(50) NOT NULL DEFAULT '',
        action      VARCHAR(50) NOT NULL DEFAULT '',
        description TEXT,
        module      VARCHAR(100),
        module_key  VARCHAR(50),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(resource, action)
      );
    `);

    // ─── ROLE PERMISSIONS (join table) ──────────────────────────────────────
    await qr.query(`
      CREATE TABLE role_permissions (
        role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);

    // ─── USERS ──────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE users (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id         UUID REFERENCES clinics(id) ON DELETE CASCADE,
        role_id           UUID REFERENCES roles(id) ON DELETE SET NULL,
        email             VARCHAR(255) NOT NULL,
        password_hash     VARCHAR(255) NOT NULL,
        first_name        VARCHAR(100) NOT NULL,
        last_name         VARCHAR(100) NOT NULL,
        phone             VARCHAR(50),
        status            user_status_enum NOT NULL DEFAULT 'active',
        is_platform_admin BOOLEAN NOT NULL DEFAULT false,
        failed_login_attempts INT NOT NULL DEFAULT 0,
        locked_until      TIMESTAMPTZ,
        last_login_at     TIMESTAMPTZ,
        deleted_at        TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(clinic_id, email)
      );
      CREATE INDEX idx_users_clinic ON users(clinic_id);
      CREATE INDEX idx_users_email  ON users(email);
    `);

    // ─── USER ↔ ROLE (eager ManyToMany join table) ──────────────────────────
    await qr.query(`
      CREATE TABLE user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );
      CREATE INDEX idx_user_roles_role ON user_roles(role_id);
    `);

    // ─── TENANT SEQUENCES ───────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE tenant_sequences (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        sequence_type  sequence_type_enum NOT NULL,
        current_value  BIGINT NOT NULL DEFAULT 0,
        prefix         VARCHAR(20) NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(clinic_id, sequence_type)
      );
      CREATE INDEX idx_tenant_sequences_clinic ON tenant_sequences(clinic_id);
    `);

    // ─── PATIENTS ───────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE patients (
        id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_number          VARCHAR(50) NOT NULL,
        first_name              VARCHAR(100) NOT NULL,
        last_name               VARCHAR(100) NOT NULL,
        date_of_birth           DATE,
        gender                  gender_enum NOT NULL DEFAULT 'unspecified',
        phone                   VARCHAR(50),
        email                   VARCHAR(255),
        address                 TEXT,
        emergency_contact_name  VARCHAR(150),
        emergency_contact_phone VARCHAR(50),
        blood_type              VARCHAR(10),
        allergies               TEXT,
        notes                   TEXT,
        status                  patient_status_enum NOT NULL DEFAULT 'active',
        created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at              TIMESTAMPTZ,
        UNIQUE(clinic_id, patient_number)
      );
      CREATE INDEX idx_patients_clinic    ON patients(clinic_id);
      CREATE INDEX idx_patients_name      ON patients(clinic_id, last_name, first_name);
      CREATE INDEX idx_patients_clinic_phone ON patients(clinic_id, phone);
      CREATE INDEX idx_patients_deleted   ON patients(deleted_at) WHERE deleted_at IS NULL;
    `);

    // ─── CLINIC SERVICES ────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE clinic_services (
        id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id                UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        name                     VARCHAR(255) NOT NULL,
        description              TEXT,
        category_id              UUID,
        default_duration_minutes INT NOT NULL DEFAULT 30,
        current_price            DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency                 VARCHAR(10) NOT NULL DEFAULT 'USD',
        is_active                BOOLEAN NOT NULL DEFAULT true,
        sort_order               INT NOT NULL DEFAULT 0,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(clinic_id, name)
      );
      CREATE INDEX idx_clinic_services_clinic ON clinic_services(clinic_id);
    `);

    // ─── APPOINTMENTS ───────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE appointments (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        provider_id         UUID NOT NULL REFERENCES users(id),
        service_id          UUID REFERENCES clinic_services(id) ON DELETE SET NULL,
        start_time          TIMESTAMPTZ NOT NULL,
        end_time            TIMESTAMPTZ NOT NULL,
        status              appointment_status_enum NOT NULL DEFAULT 'scheduled',
        notes               TEXT,
        cancellation_reason TEXT,
        created_by          UUID REFERENCES users(id),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_appointments_clinic          ON appointments(clinic_id);
      CREATE INDEX idx_appointments_provider_time   ON appointments(clinic_id, provider_id, start_time, end_time);
      CREATE INDEX idx_appointments_patient         ON appointments(clinic_id, patient_id);
    `);

    // ─── VISITS ─────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE visits (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        provider_id         UUID NOT NULL REFERENCES users(id),
        appointment_id      UUID REFERENCES appointments(id) ON DELETE SET NULL,
        original_visit_date TIMESTAMPTZ NOT NULL,
        status              visit_status_enum NOT NULL DEFAULT 'finalized',
        current_version     INT NOT NULL DEFAULT 1,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_visits_clinic   ON visits(clinic_id);
      CREATE INDEX idx_visits_patient  ON visits(clinic_id, patient_id);
    `);

    // ─── VISIT VERSIONS ─────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE visit_versions (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        visit_id        UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        version_number  INT NOT NULL,
        chief_complaint TEXT,
        diagnosis       TEXT,
        treatment_plan  TEXT,
        clinical_notes  TEXT,
        follow_up_date  DATE,
        custom_fields   JSONB NOT NULL DEFAULT '{}',
        change_reason   TEXT,
        changed_by      UUID REFERENCES users(id),
        changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(visit_id, version_number)
      );
      CREATE INDEX idx_visit_versions_visit   ON visit_versions(visit_id);
      CREATE INDEX idx_visit_versions_clinic  ON visit_versions(clinic_id);
    `);

    // ─── INVOICES ───────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE invoices (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        invoice_number  VARCHAR(50) NOT NULL,
        currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
        issue_date      DATE NOT NULL,
        due_date        DATE,
        subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
        total           DECIMAL(12,2) NOT NULL DEFAULT 0,
        paid_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
        status          invoice_status_enum NOT NULL DEFAULT 'issued',
        notes           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(clinic_id, invoice_number)
      );
      CREATE INDEX idx_invoices_clinic   ON invoices(clinic_id);
      CREATE INDEX idx_invoices_patient  ON invoices(clinic_id, patient_id);
    `);

    // ─── INVOICE ITEMS ──────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE invoice_items (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        service_id  UUID REFERENCES clinic_services(id) ON DELETE SET NULL,
        description VARCHAR(255) NOT NULL,
        unit_price  DECIMAL(12,2) NOT NULL,
        quantity    INT NOT NULL DEFAULT 1,
        line_total  DECIMAL(12,2) NOT NULL
      );
      CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
      CREATE INDEX idx_invoice_items_clinic  ON invoice_items(clinic_id);
    `);

    // ─── BEFORE/AFTER RECORDS ───────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE before_after_records (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        title       VARCHAR(255),
        description TEXT,
        treatment_description TEXT,
        notes       TEXT,
        recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_before_after_records_clinic   ON before_after_records(clinic_id);
      CREATE INDEX idx_before_after_records_patient  ON before_after_records(clinic_id, patient_id);
    `);

    // ─── BEFORE/AFTER IMAGES ────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE before_after_images (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        record_id   UUID NOT NULL REFERENCES before_after_records(id) ON DELETE CASCADE,
        image_type  before_after_image_type_enum NOT NULL,
        storage_key TEXT NOT NULL,
        caption     TEXT,
        sort_order  INT NOT NULL DEFAULT 0,
        taken_at    TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_before_after_images_record ON before_after_images(record_id);
      CREATE INDEX idx_before_after_images_clinic ON before_after_images(clinic_id);
    `);

    // ─── AUDIT LOGS ─────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE audit_logs (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE,
        user_id     UUID,
        user_email  VARCHAR(255),
        action      VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id   UUID,
        changes     JSONB,
        ip_address  VARCHAR(45),
        user_agent  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_audit_logs_clinic     ON audit_logs(clinic_id);
      CREATE INDEX idx_audit_logs_clinic_created ON audit_logs(clinic_id, created_at);
      CREATE INDEX idx_audit_logs_entity     ON audit_logs(clinic_id, entity_type, entity_id);
      CREATE INDEX idx_audit_logs_entity_global ON audit_logs(entity_type, entity_id);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `);

    // ─── CLINICAL EXTENSION TABLES ─────────────────────────────────────────
    // Patient sub-records, visit sub-records and devices. These tables exist
    // as TypeORM entities and are queried on every patient-profile / visit
    // screen, so they must be created here as well.
    await qr.query(`
      CREATE TABLE patient_allergies (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        allergen     TEXT NOT NULL,
        allergy_type VARCHAR(30) NOT NULL DEFAULT 'unknown',
        reaction     TEXT,
        severity     VARCHAR(30) NOT NULL DEFAULT 'unknown',
        status       VARCHAR(20) NOT NULL DEFAULT 'active',
        onset_date   DATE,
        notes        TEXT,
        created_by   UUID,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_patient_allergies_clinic         ON patient_allergies(clinic_id);
      CREATE INDEX idx_patient_allergies_clinic_patient ON patient_allergies(clinic_id, patient_id);

      CREATE TABLE patient_conditions (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        name            TEXT NOT NULL,
        icd_code        VARCHAR(20),
        status          VARCHAR(20) NOT NULL DEFAULT 'active',
        severity        VARCHAR(20) DEFAULT 'moderate',
        onset_date      DATE,
        resolution_date DATE,
        notes           TEXT,
        created_by      UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_patient_conditions_clinic         ON patient_conditions(clinic_id);
      CREATE INDEX idx_patient_conditions_clinic_patient ON patient_conditions(clinic_id, patient_id);

      CREATE TABLE patient_medications (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        name                TEXT NOT NULL,
        generic_name        TEXT,
        dose                TEXT,
        unit                VARCHAR(20),
        frequency           TEXT,
        route               VARCHAR(20) NOT NULL DEFAULT 'oral',
        start_date          DATE,
        end_date            DATE,
        is_current          BOOLEAN NOT NULL DEFAULT true,
        prescribed_by       TEXT,
        prescribed_at_visit UUID,
        reason              TEXT,
        notes               TEXT,
        created_by          UUID,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_patient_medications_clinic         ON patient_medications(clinic_id);
      CREATE INDEX idx_patient_medications_clinic_patient ON patient_medications(clinic_id, patient_id);

      CREATE TABLE consent_records (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        visit_id     UUID,
        consent_type VARCHAR(30) NOT NULL,
        title        TEXT NOT NULL,
        content      TEXT NOT NULL,
        method       VARCHAR(30) NOT NULL DEFAULT 'verbal',
        status       VARCHAR(20) NOT NULL DEFAULT 'given',
        signed_at    TIMESTAMPTZ,
        witness      TEXT,
        notes        TEXT,
        created_by   UUID,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_consent_records_clinic         ON consent_records(clinic_id);
      CREATE INDEX idx_consent_records_clinic_patient ON consent_records(clinic_id, patient_id);

      CREATE TABLE family_history (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        relative    VARCHAR(50) NOT NULL,
        condition   TEXT NOT NULL,
        notes       TEXT,
        created_by  UUID,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_family_history_clinic         ON family_history(clinic_id);
      CREATE INDEX idx_family_history_clinic_patient ON family_history(clinic_id, patient_id);

      CREATE TABLE patient_files (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        visit_id       UUID,
        category       VARCHAR(30) NOT NULL DEFAULT 'other',
        file_name      TEXT NOT NULL,
        mime_type      VARCHAR(100) NOT NULL,
        size_bytes     BIGINT NOT NULL,
        storage_key    TEXT NOT NULL,
        storage_bucket VARCHAR(100) NOT NULL,
        description    TEXT,
        tags           TEXT DEFAULT '',
        uploaded_by    UUID,
        is_archived    BOOLEAN NOT NULL DEFAULT false,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_patient_files_clinic               ON patient_files(clinic_id);
      CREATE INDEX idx_patient_files_clinic_patient       ON patient_files(clinic_id, patient_id);
      CREATE INDEX idx_patient_files_clinic_patient_visit ON patient_files(clinic_id, patient_id, visit_id);

      CREATE TABLE visit_diagnoses (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        visit_id    UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        code        VARCHAR(20),
        description TEXT NOT NULL,
        is_primary  BOOLEAN NOT NULL DEFAULT false,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_visit_diagnoses_clinic       ON visit_diagnoses(clinic_id);
      CREATE INDEX idx_visit_diagnoses_clinic_visit ON visit_diagnoses(clinic_id, visit_id);

      CREATE TABLE visit_measurements (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id  UUID NOT NULL,
        visit_id    UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        key         VARCHAR(100) NOT NULL,
        value       NUMERIC(10,3) NOT NULL,
        unit        VARCHAR(30) NOT NULL,
        notes       TEXT,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  UUID
      );
      CREATE INDEX idx_visit_measurements_clinic          ON visit_measurements(clinic_id);
      CREATE INDEX idx_visit_measurements_clinic_patient_key ON visit_measurements(clinic_id, patient_id, key);

      CREATE TABLE devices (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clinic_id        UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        name             VARCHAR(150) NOT NULL,
        device_type      VARCHAR(80) NOT NULL,
        manufacturer     VARCHAR(100),
        model            VARCHAR(100),
        serial_number    VARCHAR(100),
        purchase_date    DATE,
        last_calibration DATE,
        next_calibration DATE,
        status           VARCHAR(20) NOT NULL DEFAULT 'active',
        notes            TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_devices_clinic_status ON devices(clinic_id, status);
      CREATE INDEX idx_devices_clinic        ON devices(clinic_id);
    `);

    // ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────
    // Applied to every tenant-scoped table.
    // Policy: rows are visible/mutable only when clinic_id matches the
    //         per-transaction config variable app.current_tenant_id.
    // BYPASSRLS is granted to the superuser used by migrations.
    const tenantTables = [
      'clinic_branding',
      'clinic_modules',
      'roles',
      'users',
      'tenant_sequences',
      'patients',
      'clinic_services',
      'appointments',
      'visits',
      'visit_versions',
      'invoices',
      'invoice_items',
      'before_after_records',
      'before_after_images',
      'audit_logs',
    ];

    for (const table of tenantTables) {
      await qr.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await qr.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      if (table === 'audit_logs') {
        // Platform-level audit rows carry clinic_id IS NULL and must remain
        // insertable/readable from any tenant context.
        await qr.query(`
          CREATE POLICY tenant_isolation ON audit_logs
            USING (clinic_id IS NULL OR clinic_id::text = current_setting('app.current_tenant_id', true))
            WITH CHECK (clinic_id IS NULL OR clinic_id::text = current_setting('app.current_tenant_id', true));
        `);
      } else {
        await qr.query(`
          CREATE POLICY tenant_isolation ON ${table}
            USING (clinic_id::text = current_setting('app.current_tenant_id', true))
            WITH CHECK (clinic_id::text = current_setting('app.current_tenant_id', true));
        `);
      }
    }
  }

  public async down(qr: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    const tables = [
      'devices',
      'visit_measurements',
      'visit_diagnoses',
      'patient_files',
      'family_history',
      'consent_records',
      'patient_medications',
      'patient_conditions',
      'patient_allergies',
      'audit_logs',
      'before_after_images',
      'before_after_records',
      'invoice_items',
      'invoices',
      'visit_versions',
      'visits',
      'appointments',
      'clinic_services',
      'patients',
      'tenant_sequences',
      'user_roles',
      'role_permissions',
      'permissions',
      'roles',
      'users',
      'clinic_modules',
      'clinic_branding',
      'clinics',
    ];
    for (const table of tables) {
      await qr.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    await qr.query(`
      DROP TYPE IF EXISTS before_after_image_type_enum;
      DROP TYPE IF EXISTS patient_status_enum;
      DROP TYPE IF EXISTS gender_enum;
      DROP TYPE IF EXISTS sequence_type_enum;
      DROP TYPE IF EXISTS visit_status_enum;
      DROP TYPE IF EXISTS payment_method_enum;
      DROP TYPE IF EXISTS invoice_status_enum;
      DROP TYPE IF EXISTS appointment_status_enum;
      DROP TYPE IF EXISTS user_status_enum;
      DROP TYPE IF EXISTS clinic_status_enum;
    `);
  }
}
