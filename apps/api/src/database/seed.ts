/**
 * Clinic Management Platform — Database Seed Script
 *
 * Creates:
 *   1. Platform Super Admin user (bypasses tenant isolation)
 *   2. One demo clinic: "Entrustic Beauty" (slug: demo)
 *   3. Clinic owner user for the demo clinic
 *   4. Default roles + permissions for the demo clinic
 *   5. Default services for the demo clinic
 *
 * Usage:
 *   pnpm --filter @clinic/api seed
 *   NODE_ENV=development ts-node -r tsconfig-paths/register src/database/seed.ts
 *
 * IMPORTANT: Run AFTER migrations. Safe to run multiple times (idempotent via ON CONFLICT DO NOTHING).
 */

import 'reflect-metadata';
import { AppDataSource } from './data-source';
import * as argon2 from 'argon2';

const CLINIC_SLUG = process.env.SEED_CLINIC_SLUG || 'demo';
const CLINIC_NAME = process.env.SEED_CLINIC_NAME || 'Entrustic Beauty';
const CLINIC_WELCOME =
  process.env.SEED_CLINIC_WELCOME || 'مرحباً بكم في Entrustic Beauty';

async function seed() {
  console.log('🌱 Connecting to database...');
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('\n📋 Step 1: Platform Super Admin');
    // ── Platform admin bypasses RLS (no clinic_id) ──────────────────────────
    const adminPasswordHash = await argon2.hash(
      process.env.SEED_ADMIN_PASSWORD || 'ChangeMe#Admin2026!',
      { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 },
    );

    await qr.query(`
      INSERT INTO users (
        id, clinic_id, email, password_hash,
        first_name, last_name, status, is_platform_admin
      ) VALUES (
        uuid_generate_v4(),
        NULL,
        $1,
        $2,
        'Platform', 'Administrator',
        'active', true
      ) ON CONFLICT (clinic_id, email) DO NOTHING
    `, [
      process.env.SEED_ADMIN_EMAIL || 'admin@yourplatform.com',
      adminPasswordHash,
    ]);
    console.log(`   ✓ Platform admin: ${process.env.SEED_ADMIN_EMAIL || 'admin@yourplatform.com'}`);

    console.log('\n🏥 Step 2: Demo Clinic');
    const [clinic] = await qr.query(`
      INSERT INTO clinics (
        id, name, slug, clinic_type, status, country, timezone, currency, default_language, subscription_plan
      ) VALUES (
        uuid_generate_v4(),
        $1,
        $2,
        'dermatology',
        'active',
        'Egypt',
        'Africa/Cairo',
        'EGP',
        'ar',
        'professional'
      )
      ON CONFLICT (slug) DO UPDATE SET
        name        = EXCLUDED.name,
        clinic_type = EXCLUDED.clinic_type
      RETURNING id
    `, [CLINIC_NAME, CLINIC_SLUG]);
    const clinicId: string = clinic.id;
    console.log(`   ✓ Demo clinic: ${CLINIC_SLUG} — ${CLINIC_NAME} (id: ${clinicId})`);

    console.log('\n🎨 Step 3: Clinic Branding');
    await qr.query(`
      INSERT INTO clinic_branding (id, clinic_id, primary_color, welcome_message)
      VALUES (uuid_generate_v4(), $1, '#ec4899', $2)
      ON CONFLICT (clinic_id) DO NOTHING
    `, [clinicId, CLINIC_WELCOME]);
    console.log('   ✓ Branding created');

    console.log('\n🔧 Step 4: Clinic Modules');
    const modules = [
      { key: 'appointments', enabled: true },
      { key: 'medical_records', enabled: true },
      { key: 'invoicing', enabled: true },
      { key: 'before_after', enabled: true },
      { key: 'audit_logs', enabled: true },
    ];
    for (const mod of modules) {
      await qr.query(`
        INSERT INTO clinic_modules (id, clinic_id, module_key, is_enabled)
        VALUES (uuid_generate_v4(), $1, $2, $3)
        ON CONFLICT (clinic_id, module_key) DO NOTHING
      `, [clinicId, mod.key, mod.enabled]);
    }
    console.log(`   ✓ ${modules.length} modules configured`);

    console.log('\n🔑 Step 5: Permissions');
    const permissions = [
      { key: 'patients:read',        desc: 'View patients',               module: 'patients' },
      { key: 'patients:create',      desc: 'Create patients',             module: 'patients' },
      { key: 'patients:update',      desc: 'Update patients',             module: 'patients' },
      { key: 'patients:delete',      desc: 'Archive patients',            module: 'patients' },
      { key: 'appointments:read',    desc: 'View appointments',           module: 'appointments' },
      { key: 'appointments:create',  desc: 'Book appointments',           module: 'appointments' },
      { key: 'appointments:update',  desc: 'Update appointments',         module: 'appointments' },
      { key: 'appointments:delete',  desc: 'Cancel appointments',         module: 'appointments' },
      { key: 'records:read',         desc: 'View medical records',        module: 'records' },
      { key: 'records:create',       desc: 'Create medical records',      module: 'records' },
      { key: 'records:amend',        desc: 'Amend medical records',       module: 'records' },
      { key: 'invoices:read',        desc: 'View invoices',               module: 'invoices' },
      { key: 'invoices:create',      desc: 'Create invoices',             module: 'invoices' },
      { key: 'invoices:payment',     desc: 'Record payments',             module: 'invoices' },
      { key: 'services:read',        desc: 'View services',               module: 'services' },
      { key: 'services:manage',      desc: 'Manage services',             module: 'services' },
      { key: 'before_after:read',    desc: 'View before/after records',   module: 'before_after' },
      { key: 'before_after:create',  desc: 'Create before/after records', module: 'before_after' },
      { key: 'audit:read',           desc: 'View audit logs',             module: 'audit' },
      { key: 'users:manage',         desc: 'Manage clinic staff',         module: 'admin' },
      { key: 'roles:manage',         desc: 'Manage roles',                module: 'admin' },
      { key: 'conditions:read', desc: 'View patient conditions', module: 'medical_records' },
      { key: 'conditions:write', desc: 'Add/edit patient conditions', module: 'medical_records' },
      { key: 'allergies:read', desc: 'View patient allergies', module: 'medical_records' },
      { key: 'allergies:write', desc: 'Add/edit patient allergies', module: 'medical_records' },
      { key: 'medications:read', desc: 'View patient medications', module: 'medical_records' },
      { key: 'medications:write', desc: 'Add/edit patient medications', module: 'medical_records' },
      { key: 'family_history:read', desc: 'View family history', module: 'medical_records' },
      { key: 'family_history:write', desc: 'Write family history', module: 'medical_records' },
      { key: 'files:read', desc: 'View patient files', module: 'medical_records' },
      { key: 'files:upload', desc: 'Upload patient files', module: 'medical_records' },
      { key: 'files:archive', desc: 'Archive patient files', module: 'medical_records' },
      { key: 'consent:read', desc: 'View consent records', module: 'medical_records' },
      { key: 'consent:write', desc: 'Create consent records', module: 'medical_records' },
      { key: 'measurements:read', desc: 'View clinical measurements', module: 'medical_records' },
      { key: 'measurements:write', desc: 'Record clinical measurements', module: 'medical_records' },
      { key: 'drugs:read', desc: 'View drug catalog', module: 'prescriptions' },
      { key: 'drugs:manage', desc: 'Manage drug catalog', module: 'prescriptions' },
      { key: 'prescriptions:read', desc: 'View prescriptions', module: 'prescriptions' },
      { key: 'prescriptions:write', desc: 'Create prescriptions', module: 'prescriptions' },
      { key: 'inventory:read', desc: 'View inventory & stock alerts', module: 'inventory' },
      { key: 'inventory:manage', desc: 'Manage inventory items & batches', module: 'inventory' },
      { key: 'lab:read', desc: 'View lab tests, requests & results', module: 'lab' },
      { key: 'lab:manage', desc: 'Order lab requests & enter results', module: 'lab' },
      { key: 'notifications:read', desc: 'View reminders & message outbox', module: 'notifications' },
      { key: 'notifications:manage', desc: 'Send messages & configure reminders', module: 'notifications' },
      { key: 'staff:read', desc: 'View clinic staff directory', module: 'admin' },
      { key: 'staff:manage', desc: 'Manage clinic staff', module: 'admin' },
      { key: 'roles:read', desc: 'View roles & permissions', module: 'admin' },
      { key: 'settings:manage', desc: 'Manage clinic profile & branding', module: 'admin' },
    ];

    const permissionIds: Record<string, string> = {};
    for (const perm of permissions) {
      // Split key ('patients:read') into resource/action in JS — reusing the
      // same $1 in both a varchar column and split_part(text) makes PostgreSQL
      // reject the query with 42P08 (ambiguous parameter type).
      const sep = perm.key.indexOf(':');
      const resource = sep === -1 ? perm.key : perm.key.slice(0, sep);
      const action = sep === -1 ? '' : perm.key.slice(sep + 1);
      const [row] = await qr.query(`
        INSERT INTO permissions (id, key, description, module, resource, action, module_key)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
        ON CONFLICT (key) DO UPDATE SET
          description = EXCLUDED.description,
          resource    = EXCLUDED.resource,
          action      = EXCLUDED.action,
          module_key  = EXCLUDED.module_key
        RETURNING id
      `, [perm.key, perm.desc, perm.module, resource, action, perm.module]);
      permissionIds[perm.key] = row.id;
    }
    console.log(`   ✓ ${permissions.length} permissions upserted`);

    console.log('\n👥 Step 6: Default Roles');
    // Clinic Owner — all permissions
    const [ownerRole] = await qr.query(`
      INSERT INTO roles (id, clinic_id, name, display_name, description, is_system)
      VALUES (uuid_generate_v4(), $1, 'clinic_owner', 'Clinic Owner', 'Full access to all clinic features', true)
      ON CONFLICT (clinic_id, name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id
    `, [clinicId]);

    // Doctor — clinical permissions
    const [doctorRole] = await qr.query(`
      INSERT INTO roles (id, clinic_id, name, display_name, description, is_system)
      VALUES (uuid_generate_v4(), $1, 'doctor', 'Doctor', 'Clinical staff with patient management access', true)
      ON CONFLICT (clinic_id, name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id
    `, [clinicId]);

    // Receptionist — scheduling & billing only
    const [receptionRole] = await qr.query(`
      INSERT INTO roles (id, clinic_id, name, display_name, description, is_system)
      VALUES (uuid_generate_v4(), $1, 'receptionist', 'Receptionist', 'Appointment scheduling and billing', true)
      ON CONFLICT (clinic_id, name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id
    `, [clinicId]);

    console.log('   ✓ 3 roles created (clinic_owner, doctor, receptionist)');

    // Assign all permissions to clinic_owner
    for (const permId of Object.values(permissionIds)) {
      await qr.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [ownerRole.id, permId]);
    }

    // Doctor permissions
    const doctorPerms = [
      'patients:read', 'patients:create', 'patients:update',
      'appointments:read', 'appointments:create', 'appointments:update',
      'records:read', 'records:create', 'records:amend',
      'invoices:read', 'services:read',
      'before_after:read', 'before_after:create',
      'conditions:read', 'conditions:write',
      'allergies:read', 'allergies:write',
      'medications:read', 'medications:write',
      'family_history:read', 'family_history:write',
      'files:read', 'files:upload', 'files:archive',
      'consent:read', 'consent:write',
      'measurements:read', 'measurements:write',
      'drugs:read', 'prescriptions:read', 'prescriptions:write',
      'inventory:read',
      'lab:read',
      'notifications:read',
    ];
    for (const key of doctorPerms) {
      if (permissionIds[key]) {
        await qr.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [doctorRole.id, permissionIds[key]]);
      }
    }

    // Receptionist permissions
    const receptionPerms = [
      'patients:read', 'patients:create', 'patients:update',
      'appointments:read', 'appointments:create', 'appointments:update',
      'invoices:read', 'invoices:create', 'invoices:payment',
      'services:read',
    ];
    for (const key of receptionPerms) {
      if (permissionIds[key]) {
        await qr.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [receptionRole.id, permissionIds[key]]);
      }
    }
    console.log('   ✓ Role-permission assignments complete');

    console.log('\n👤 Step 7: Demo Clinic Owner User');
    const ownerPasswordHash = await argon2.hash(
      process.env.SEED_CLINIC_OWNER_PASSWORD || 'Demo#Owner2026!',
      { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 },
    );

    // Set RLS context for this insertion (clinic owner lives inside the clinic)
    await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [clinicId]);
    await qr.query(`
      INSERT INTO users (
        id, clinic_id, role_id, email, password_hash,
        first_name, last_name, status, is_platform_admin
      ) VALUES (
        uuid_generate_v4(),
        $1, $2, $3, $4,
        'Ahmed', 'Al-Shifa',
        'active', false
      ) ON CONFLICT (clinic_id, email) DO NOTHING
    `, [
      clinicId,
      ownerRole.id,
      process.env.SEED_CLINIC_OWNER_EMAIL || 'owner@demo.yourplatform.com',
      ownerPasswordHash,
    ]);
    console.log(`   ✓ Demo owner: ${process.env.SEED_CLINIC_OWNER_EMAIL || 'owner@demo.yourplatform.com'}`);

    // Link the owner to the clinic_owner role — User.roles is an eager
    // ManyToMany through user_roles, and auth.service builds the JWT
    // permissions from it (without this link the owner would log in with
    // zero roles/permissions).
    const [ownerUser] = await qr.query(
      `SELECT id FROM users WHERE clinic_id = $1 AND email = $2`,
      [clinicId, process.env.SEED_CLINIC_OWNER_EMAIL || 'owner@demo.yourplatform.com'],
    );
    if (ownerUser?.id) {
      await qr.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [ownerUser.id, ownerRole.id],
      );
      console.log('   ✓ Owner linked to clinic_owner role (user_roles)');
    }

    console.log('\n🩺 Step 8: Demo Clinic Services');
    const services = [
      { name: 'Aesthetic & Dermatology Consultation', duration: 30, price: 300 },
      { name: 'Botox Anti-Wrinkle Injection (Full Upper Face)', duration: 30, price: 1500 },
      { name: 'Hyaluronic Acid Dermal Filler (1ml)', duration: 45, price: 2500 },
      { name: 'Candela Laser Hair Removal (Full Body)', duration: 60, price: 1800 },
      { name: 'Hydrafacial Syndeo Deep Cleansing & Infusion', duration: 45, price: 1200 },
      { name: 'Medical Chemical Glow Peel', duration: 45, price: 600 },
      { name: 'Morpheus8 RF Microneedling Session', duration: 60, price: 2200 },
      { name: 'Dermapen Microneedling with PRP / Exosomes', duration: 45, price: 1100 },
      { name: 'Full-Body Digital Mole Mapping & Dermoscopy', duration: 45, price: 500 },
      { name: 'Post-Procedure Follow-Up & Touch-Up', duration: 20, price: 150 },
    ];

    for (const [i, srv] of services.entries()) {
      await qr.query(`
        INSERT INTO clinic_services (
          id, clinic_id, name, default_duration_minutes,
          current_price, currency, is_active, sort_order
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, 'EGP', true, $5
        ) ON CONFLICT DO NOTHING
      `, [clinicId, srv.name, srv.duration, srv.price, i + 1]);
    }
    console.log(`   ✓ ${services.length} services created`);

    console.log('\n⚡ Step 8.5: Demo Clinic Devices & Laser Systems');
    const seedDevices = [
      {
        name: 'Candela GentleMax Pro Plus Workstation',
        device_type: 'laser',
        manufacturer: 'Candela Medical',
        model: 'GentleMax Pro Plus',
        serial_number: 'CN-89421-2024',
        last_calibration: '2026-08-10',
        next_calibration: '2027-02-10',
        status: 'active',
        notes: 'Dual 755nm Alex / 1064nm Nd:YAG, Dynamic Cooling Device (DCD) cryogen',
      },
      {
        name: 'Hydrafacial Elite MD Syndeo',
        device_type: 'hydrafacial',
        manufacturer: 'BeautyHealth Company',
        model: 'Syndeo Cloud-Connected',
        serial_number: 'HF-99014-2024',
        last_calibration: '2026-07-01',
        next_calibration: '2027-01-01',
        status: 'active',
        notes: 'Vortex-Fusion serum delivery, lymphatic drainage handpieces, LED red/blue light',
      },
      {
        name: 'InMode Morpheus8 RF Platform',
        device_type: 'rf_microneedle',
        manufacturer: 'InMode Ltd.',
        model: 'Optimas Morpheus8',
        serial_number: 'IM-30419-2024',
        last_calibration: '2026-06-15',
        next_calibration: '2026-12-15',
        status: 'active',
        notes: 'Subdermal adipose remodeling device (SARD) up to 4mm depth',
      },
      {
        name: 'Lumenis Stellar M22 Multi-Application Platform',
        device_type: 'ipl',
        manufacturer: 'Lumenis',
        model: 'Stellar M22',
        serial_number: 'LM-77120-2024',
        last_calibration: '2026-05-18',
        next_calibration: '2026-11-18',
        status: 'active',
        notes: 'IPL photofacial with 9 ExpertFilters & ResurFX fractional non-ablative laser',
      },
      {
        name: 'DermLite DL4 Polarized Dermatoscope',
        device_type: 'dermatoscope',
        manufacturer: '3Gen DermLite',
        model: 'DL4 4th Gen',
        serial_number: 'DL-88194-2024',
        last_calibration: '2026-06-10',
        next_calibration: '2027-06-10',
        status: 'active',
        notes: 'Polarized & non-polarized illumination, pigment boost mode',
      },
    ];

    for (const dev of seedDevices) {
      await qr.query(`
        INSERT INTO devices (
          id, clinic_id, name, device_type, manufacturer, model,
          serial_number, last_calibration, next_calibration, status, notes
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) ON CONFLICT DO NOTHING
      `, [
        clinicId, dev.name, dev.device_type, dev.manufacturer, dev.model,
        dev.serial_number, dev.last_calibration, dev.next_calibration, dev.status, dev.notes
      ]);
    }
    console.log(`   ✓ ${seedDevices.length} aesthetic laser & treatment devices seeded`);

    console.log('\n🔢 Step 9: Tenant Sequences');
    await qr.query(`
      INSERT INTO tenant_sequences (id, clinic_id, sequence_type, current_value, prefix)
      VALUES
        (uuid_generate_v4(), $1, 'PATIENT', '0', 'PAT-'),
        (uuid_generate_v4(), $1, 'INVOICE', '0', $2),
        (uuid_generate_v4(), $1, 'LAB', '0', $3)
      ON CONFLICT (clinic_id, sequence_type) DO NOTHING
    `, [clinicId, `INV-${new Date().getFullYear()}-`, `LAB-${new Date().getFullYear()}-`]);
    console.log('   ✓ Sequences initialized (PATIENT, INVOICE, LAB)');

    console.log('\n💊 Step 10: Drug Catalog & Interactions');
    // Clinic drug catalog (shared across specialties; seeded to every clinic).
    const drugCatalog: Array<{
      name: string;
      generic: string;
      category: string;
      form: string;
      strength: string;
      substances: string[];
      doses: string;
    }> = [
      { name: 'Panadol', generic: 'Paracetamol', category: 'Analgesic / Antipyretic', form: 'Tablet', strength: '500 mg', substances: ['paracetamol', 'acetaminophen'], doses: '1–2 tabs every 6h (max 4 g/day)' },
      { name: 'Brufen', generic: 'Ibuprofen', category: 'NSAID', form: 'Tablet', strength: '400 mg', substances: ['ibuprofen', 'nsaid'], doses: '1 tab 3x/day after food' },
      { name: 'Aspirin', generic: 'Acetylsalicylic Acid', category: 'NSAID / Antiplatelet', form: 'Tablet', strength: '81 / 325 mg', substances: ['aspirin', 'acetylsalicylic acid', 'salicylate'], doses: '75–100 mg daily (cardioprotective)' },
      { name: 'Amoxil', generic: 'Amoxicillin', category: 'Antibiotic', form: 'Capsule', strength: '500 mg', substances: ['amoxicillin', 'penicillin', 'beta-lactam'], doses: '1 cap 3x/day for 7 days' },
      { name: 'Augmentin', generic: 'Amoxicillin / Clavulanate', category: 'Antibiotic', form: 'Tablet', strength: '625 mg', substances: ['amoxicillin', 'clavulanate', 'penicillin', 'beta-lactam'], doses: '1 tab 2–3x/day with food' },
      { name: 'Ciprobay', generic: 'Ciprofloxacin', category: 'Antibiotic', form: 'Tablet', strength: '500 mg', substances: ['ciprofloxacin', 'fluoroquinolone'], doses: '1 tab 2x/day for 5–7 days' },
      { name: 'Klacid', generic: 'Clarithromycin', category: 'Antibiotic', form: 'Tablet', strength: '500 mg', substances: ['clarithromycin', 'macrolide'], doses: '1 tab 2x/day for 7 days' },
      { name: 'Doxycycline', generic: 'Doxycycline', category: 'Antibiotic', form: 'Capsule', strength: '100 mg', substances: ['doxycycline', 'tetracycline'], doses: '1 cap daily (with water, upright)' },
      { name: 'Flagyl', generic: 'Metronidazole', category: 'Antibiotic / Antiprotozoal', form: 'Tablet', strength: '500 mg', substances: ['metronidazole', 'nitroimidazole'], doses: '1 tab 3x/day (avoid alcohol)' },
      { name: 'Glucophage', generic: 'Metformin', category: 'Antidiabetic', form: 'Tablet', strength: '500 mg', substances: ['metformin'], doses: '1 tab 2x/day with meals' },
      { name: 'Lipitor', generic: 'Atorvastatin', category: 'Lipid-lowering', form: 'Tablet', strength: '20 mg', substances: ['atorvastatin', 'statin'], doses: '1 tab nightly' },
      { name: 'Zestril', generic: 'Lisinopril', category: 'ACE Inhibitor', form: 'Tablet', strength: '10 mg', substances: ['lisinopril', 'ace inhibitor'], doses: '1 tab daily' },
      { name: 'Marevan', generic: 'Warfarin', category: 'Anticoagulant', form: 'Tablet', strength: '5 mg', substances: ['warfarin', 'anticoagulant', 'coumarin'], doses: 'Dose per INR protocol' },
      { name: 'Plavix', generic: 'Clopidogrel', category: 'Antiplatelet', form: 'Tablet', strength: '75 mg', substances: ['clopidogrel', 'antiplatelet'], doses: '1 tab daily' },
      { name: 'Lanoxin', generic: 'Digoxin', category: 'Cardiac Glycoside', form: 'Tablet', strength: '0.25 mg', substances: ['digoxin'], doses: 'Per cardiology protocol (monitor levels)' },
      { name: 'Lasix', generic: 'Furosemide', category: 'Loop Diuretic', form: 'Tablet', strength: '40 mg', substances: ['furosemide', 'loop diuretic'], doses: '1 tab daily (morning)' },
      { name: 'Aldactone', generic: 'Spironolactone', category: 'Potassium-sparing Diuretic', form: 'Tablet', strength: '25 mg', substances: ['spironolactone'], doses: '1 tab daily' },
      { name: 'Losec', generic: 'Omeprazole', category: 'PPI', form: 'Capsule', strength: '20 mg', substances: ['omeprazole', 'proton pump inhibitor', 'ppi'], doses: '1 cap before breakfast' },
      { name: 'Valium', generic: 'Diazepam', category: 'Benzodiazepine', form: 'Tablet', strength: '5 mg', substances: ['diazepam', 'benzodiazepine'], doses: 'Short-term only, as directed' },
      { name: 'Tramal', generic: 'Tramadol', category: 'Opioid Analgesic', form: 'Capsule', strength: '50 mg', substances: ['tramadol', 'opioid'], doses: '1 cap every 6–8h PRN (max 400 mg/day)' },
      { name: 'Zoloft', generic: 'Sertraline', category: 'SSRI', form: 'Tablet', strength: '50 mg', substances: ['sertraline', 'ssri'], doses: '1 tab daily (morning)' },
      { name: 'Prozac', generic: 'Fluoxetine', category: 'SSRI', form: 'Capsule', strength: '20 mg', substances: ['fluoxetine', 'ssri'], doses: '1 cap daily' },
      { name: 'Deltacortril', generic: 'Prednisolone', category: 'Corticosteroid', form: 'Tablet', strength: '5 mg', substances: ['prednisolone', 'corticosteroid', 'steroid'], doses: 'Per tapering schedule' },
      { name: 'Ventolin', generic: 'Salbutamol', category: 'Bronchodilator', form: 'Inhaler', strength: '100 mcg/dose', substances: ['salbutamol', 'albuterol', 'beta-2 agonist'], doses: '1–2 puffs PRN 4–6 hourly' },
      { name: 'Zyrtec', generic: 'Cetirizine', category: 'Antihistamine', form: 'Tablet', strength: '10 mg', substances: ['cetirizine', 'antihistamine'], doses: '1 tab nightly' },
      { name: 'Euthyrox', generic: 'Levothyroxine', category: 'Thyroid Hormone', form: 'Tablet', strength: '50 mcg', substances: ['levothyroxine', 'thyroxine'], doses: '1 tab daily on empty stomach (fasting)' },
      { name: 'Botox Cosmetic', generic: 'OnabotulinumtoxinA', category: 'Neurotoxin / Aesthetic', form: 'Vial', strength: '100 Units', substances: ['onabotulinumtoxina', 'botulinum toxin'], doses: '20–50 Units per facial zone' },
      { name: 'Dysport', generic: 'AbobotulinumtoxinA', category: 'Neurotoxin / Aesthetic', form: 'Vial', strength: '300 Units', substances: ['abobotulinumtoxina', 'botulinum toxin'], doses: '50–120 Units per facial zone' },
      { name: 'Juvederm Ultra 4', generic: 'Hyaluronic Acid Gel', category: 'Dermal Filler', form: 'Syringe', strength: '24 mg/mL', substances: ['hyaluronic acid', 'dermal filler'], doses: '1–2 mL for lip / cheek enhancement' },
      { name: 'Restylane Kysse', generic: 'Hyaluronic Acid Gel with Lidocaine', category: 'Dermal Filler', form: 'Syringe', strength: '20 mg/mL', substances: ['hyaluronic acid', 'lidocaine'], doses: '1 mL lip contouring' },
      { name: 'Hyaluronidase', generic: 'Hyaluronidase', category: 'Emergency Enzyme / Reversal', form: 'Ampoule', strength: '1500 IU', substances: ['hyaluronidase'], doses: '150–300 IU per nodule / vascular emergency' },
      { name: 'EMLA Cream', generic: 'Lidocaine / Prilocaine', category: 'Topical Anesthetic', form: 'Cream', strength: '2.5% / 2.5%', substances: ['lidocaine', 'prilocaine'], doses: 'Apply thick layer 30–45 min pre-procedure' },
      { name: 'Differin', generic: 'Adapalene', category: 'Retinoid / Anti-Acne', form: 'Gel', strength: '0.1%', substances: ['adapalene', 'retinoid'], doses: 'Apply thin layer nightly after cleansing' },
      { name: 'Acretin', generic: 'Tretinoin', category: 'Retinoid / Anti-Aging', form: 'Cream', strength: '0.05%', substances: ['tretinoin', 'retinoid'], doses: 'Pea-sized amount nightly to dry skin' },
      { name: 'Skinoren', generic: 'Azelaic Acid', category: 'Dermatological / Anti-Pigment', form: 'Cream', strength: '20%', substances: ['azelaic acid'], doses: 'Apply 2x daily for acne / melasma' },
      { name: 'Curacne', generic: 'Isotretinoin', category: 'Systemic Retinoid', form: 'Capsule', strength: '20 mg', substances: ['isotretinoin', 'retinoid'], doses: '1 cap daily with fatty meal (monitor LFT & lipids)' },
      { name: 'Fucidin', generic: 'Fusidic Acid', category: 'Topical Antibiotic', form: 'Cream', strength: '2%', substances: ['fusidic acid'], doses: 'Apply 2–3 times daily for 7 days post-procedure' },
    ];

    const drugIdsByGeneric: Record<string, string> = {};
    for (const drug of drugCatalog) {
      const [row] = await qr.query(`
        INSERT INTO drugs (id, clinic_id, name, generic_name, category, form, strength, substances, common_doses, is_seed)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (clinic_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [clinicId, drug.name, drug.generic, drug.category, drug.form, drug.strength, drug.substances, drug.doses]);
      drugIdsByGeneric[drug.generic] = row.id;
    }
    console.log(`   ✓ ${drugCatalog.length} drugs in catalog`);

    const interactions: Array<{ a: string; b: string; severity: 'minor' | 'moderate' | 'major'; advice: string }> = [
      { a: 'Warfarin', b: 'Acetylsalicylic Acid', severity: 'major', advice: 'Combined bleeding risk — avoid unless prescribed with close INR monitoring' },
      { a: 'Warfarin', b: 'Ibuprofen', severity: 'major', advice: 'GI bleeding + INR elevation — prefer paracetamol' },
      { a: 'Warfarin', b: 'Ciprofloxacin', severity: 'major', advice: 'Ciprofloxacin potentiates warfarin — monitor INR closely' },
      { a: 'Warfarin', b: 'Metronidazole', severity: 'major', advice: 'Metronidazole markedly increases INR — avoid / monitor' },
      { a: 'Warfarin', b: 'Amoxicillin', severity: 'moderate', advice: 'May alter INR — monitor' },
      { a: 'Warfarin', b: 'Clopidogrel', severity: 'major', advice: 'Dual antithrombotic therapy — significant bleeding risk' },
      { a: 'Ibuprofen', b: 'Acetylsalicylic Acid', severity: 'moderate', advice: 'Reduces cardioprotection and raises GI bleed risk' },
      { a: 'Ibuprofen', b: 'Lisinopril', severity: 'moderate', advice: 'Reduced antihypertensive effect + nephrotoxicity risk' },
      { a: 'Ibuprofen', b: 'Prednisolone', severity: 'moderate', advice: 'Increased GI ulcer/bleeding risk' },
      { a: 'Lisinopril', b: 'Spironolactone', severity: 'major', advice: 'Hyperkalemia risk — monitor potassium' },
      { a: 'Lisinopril', b: 'Acetylsalicylic Acid', severity: 'moderate', advice: 'Reduced ACE-inhibitor antihypertensive effect' },
      { a: 'Digoxin', b: 'Furosemide', severity: 'moderate', advice: 'Hypokalemia increases digoxin toxicity — monitor K+' },
      { a: 'Digoxin', b: 'Spironolactone', severity: 'moderate', advice: 'May raise digoxin levels — monitor' },
      { a: 'Atorvastatin', b: 'Clarithromycin', severity: 'major', advice: 'Increased statin levels — rhabdomyolysis risk — pause statin' },
      { a: 'Clopidogrel', b: 'Omeprazole', severity: 'moderate', advice: 'Reduced clopidogrel activation — consider pantoprazole' },
      { a: 'Levothyroxine', b: 'Omeprazole', severity: 'moderate', advice: 'Reduced levothyroxine absorption — separate doses by 4h' },
      { a: 'Tramadol', b: 'Sertraline', severity: 'major', advice: 'Serotonin syndrome risk — avoid combination' },
      { a: 'Tramadol', b: 'Fluoxetine', severity: 'major', advice: 'Serotonin syndrome risk — avoid combination' },
      { a: 'Sertraline', b: 'Fluoxetine', severity: 'major', advice: 'Avoid duplicating SSRIs — serotonin syndrome risk' },
      { a: 'Diazepam', b: 'Tramadol', severity: 'moderate', advice: 'Additive CNS/respiratory depression — avoid' },
    ];

    let interactionCount = 0;
    for (const it of interactions) {
      const aId = drugIdsByGeneric[it.a];
      const bId = drugIdsByGeneric[it.b];
      if (!aId || !bId) continue;
      await qr.query(`
        INSERT INTO drug_interactions (id, clinic_id, drug_a_id, drug_b_id, severity, advice)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
        ON CONFLICT (clinic_id, drug_a_id, drug_b_id)
        DO UPDATE SET severity = EXCLUDED.severity, advice = EXCLUDED.advice
      `, [clinicId, aId, bId, it.severity, it.advice]);
      interactionCount++;
    }
    console.log(`   ✓ ${interactionCount} drug–drug interactions seeded`);

    console.log('\n📦 Step 11: Inventory & Expiry Tracking');
    const inventorySeed: Array<{
      name: string;
      sku: string;
      category: string;
      unit: string;
      reorder: number;
      batches: Array<{ batch: string; qty: number; expiry: string }>; // expiry: literal date or relative expression
    }> = [
      {
        name: 'Panadol 500 mg', sku: 'MED-PAN-500', category: 'Analgesic', unit: 'strip', reorder: 20,
        batches: [{ batch: 'PAN-2601', qty: 40, expiry: `CURRENT_DATE + INTERVAL '8 months'` }],
      },
      {
        name: 'Amoxil 500 mg', sku: 'MED-AMX-500', category: 'Antibiotic', unit: 'strip', reorder: 10,
        batches: [
          { batch: 'AMX-2591', qty: 2, expiry: `CURRENT_DATE + INTERVAL '5 months'` },
          { batch: 'AMX-2601', qty: 1, expiry: `CURRENT_DATE + INTERVAL '11 months'` },
        ],
      },
      {
        name: 'Dipyrone ampoules 1 g', sku: 'MED-DIP-1G', category: 'Analgesic', unit: 'ampoule', reorder: 25,
        batches: [{ batch: 'DIP-2598', qty: 25, expiry: `CURRENT_DATE + INTERVAL '6 months'` }],
      },
      {
        name: 'Insulin glargine pen', sku: 'MED-INS-GLA', category: 'Endocrine', unit: 'pen', reorder: 5,
        batches: [{ batch: 'INS-2602', qty: 6, expiry: `CURRENT_DATE + INTERVAL '45 days'` }],
      },
      {
        name: 'Vitamin D3 2000 IU', sku: 'SUP-VITD3', category: 'Supplement', unit: 'bottle', reorder: 8,
        batches: [{ batch: 'VIT-2603', qty: 10, expiry: `CURRENT_DATE + INTERVAL '30 days'` }],
      },
      {
        name: 'Syringes 5 ml', sku: 'SUP-SYR-5ML', category: 'Consumable', unit: 'piece', reorder: 50,
        batches: [{ batch: 'SYR-2599', qty: 12, expiry: `CURRENT_DATE + INTERVAL '12 months'` }],
      },
      {
        name: 'Surgical gloves (latex)', sku: 'SUP-GLV-L', category: 'Consumable', unit: 'box', reorder: 5,
        batches: [{ batch: 'GLV-2597', qty: 10, expiry: `CURRENT_DATE + INTERVAL '10 months'` }],
      },
      {
        name: 'Alcohol 70% 500 ml', sku: 'SUP-ALC-70', category: 'Consumable', unit: 'bottle', reorder: 6,
        batches: [{ batch: 'ALC-2596', qty: 8, expiry: `CURRENT_DATE + INTERVAL '9 months'` }],
      },
      {
        name: 'Betadine solution 120 ml', sku: 'SUP-BET-120', category: 'Antiseptic', unit: 'bottle', reorder: 6,
        batches: [{ batch: 'BET-2595', qty: 5, expiry: `CURRENT_DATE - INTERVAL '15 days'` }],
      },
      {
        name: 'Botox Cosmetic 100U', sku: 'AES-BTX-100U', category: 'Neurotoxin', unit: 'vial', reorder: 5,
        batches: [{ batch: 'BTX-2601', qty: 15, expiry: `CURRENT_DATE + INTERVAL '10 months'` }],
      },
      {
        name: 'Juvederm Ultra 4 (2x1ml)', sku: 'AES-JUV-U4', category: 'Filler', unit: 'box', reorder: 4,
        batches: [{ batch: 'JUV-2602', qty: 10, expiry: `CURRENT_DATE + INTERVAL '14 months'` }],
      },
      {
        name: 'Hyaluronidase 1500 IU Emergency', sku: 'MED-HYAL-1500', category: 'Enzyme', unit: 'ampoule', reorder: 3,
        batches: [{ batch: 'HYAL-2603', qty: 8, expiry: `CURRENT_DATE + INTERVAL '12 months'` }],
      },
      {
        name: 'Candela DCD Cryogen Canister 1000g', sku: 'LAS-CRY-1000', category: 'Laser Consumable', unit: 'canister', reorder: 3,
        batches: [{ batch: 'CRY-2604', qty: 6, expiry: `CURRENT_DATE + INTERVAL '24 months'` }],
      },
      {
        name: 'Hydrafacial Syndeo Serum Essentials (Activ-4 / Beta-HD)', sku: 'HF-SER-ESS', category: 'Serum', unit: 'set', reorder: 4,
        batches: [{ batch: 'HF-2605', qty: 8, expiry: `CURRENT_DATE + INTERVAL '6 months'` }],
      },
      {
        name: 'Meso-needles 32G 4mm', sku: 'SUP-MESO-32G', category: 'Consumable', unit: 'box', reorder: 5,
        batches: [{ batch: 'MESO-2606', qty: 12, expiry: `CURRENT_DATE + INTERVAL '18 months'` }],
      },
    ];

    let itemCount = 0;
    let batchCount = 0;
    for (const it of inventorySeed) {
      const [itemRow] = await qr.query(`
        INSERT INTO inventory_items (id, clinic_id, name, sku, category, unit, reorder_level, is_active)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (clinic_id, sku) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          reorder_level = EXCLUDED.reorder_level,
          is_active = true
        RETURNING id
      `, [clinicId, it.name, it.sku, it.category, it.unit, it.reorder]);
      itemCount++;

      // Replace seeded batches for this item to stay idempotent on reseed
      await qr.query(
        `DELETE FROM inventory_batches WHERE item_id = $1 AND clinic_id = $2`,
        [itemRow.id, clinicId],
      );
      for (const b of it.batches) {
        await qr.query(`
          INSERT INTO inventory_batches
            (id, clinic_id, item_id, batch_number, expiry_date, quantity_in, quantity_remaining, received_at, notes)
          VALUES (uuid_generate_v4(), $1, $2, $3, ${b.expiry}, $4, $4, now(), 'Seed stock')
        `, [clinicId, itemRow.id, b.batch, b.qty]);
        batchCount++;
      }
    }
    console.log(`   ✓ ${itemCount} inventory items, ${batchCount} batches seeded (incl. low-stock & near-expiry)`);


    console.log('\n🧪 Step 12: Lab Samples & Results Tracking');
    const labTests: Array<{
      name: string;
      category: string;
      sampleType: string;
      sampleTube: string;
      unit: string;
      referenceRange: string;
      turnaroundHours: number;
    }> = [
      { name: 'Complete Blood Count (CBC)', category: 'Hematology', sampleType: 'Blood', sampleTube: 'EDTA', unit: '×10³/µL', referenceRange: 'WBC 4.0–11.0 · Hb 12–16 g/dL · Plt 150–400', turnaroundHours: 24 },
      { name: 'Fasting Blood Glucose', category: 'Blood Chemistry', sampleType: 'Blood', sampleTube: 'Fluoride', unit: 'mg/dL', referenceRange: '70–99 (fasting)', turnaroundHours: 6 },
      { name: 'HbA1c', category: 'Blood Chemistry', sampleType: 'Blood', sampleTube: 'EDTA', unit: '%', referenceRange: '< 5.7 normal · 5.7–6.4 pre-diabetes', turnaroundHours: 24 },
      { name: 'Lipid Profile', category: 'Blood Chemistry', sampleType: 'Blood', sampleTube: 'Plain', unit: 'mg/dL', referenceRange: 'LDL < 100 · HDL > 40 · TG < 150', turnaroundHours: 24 },
      { name: 'TSH', category: 'Hormones', sampleType: 'Blood', sampleTube: 'Plain', unit: 'µIU/mL', referenceRange: '0.4–4.0', turnaroundHours: 24 },
      { name: 'ALT (SGPT)', category: 'Blood Chemistry', sampleType: 'Blood', sampleTube: 'Plain', unit: 'U/L', referenceRange: '7–56', turnaroundHours: 12 },
      { name: 'Serum Creatinine', category: 'Blood Chemistry', sampleType: 'Blood', sampleTube: 'Plain', unit: 'mg/dL', referenceRange: '0.6–1.2', turnaroundHours: 12 },
      { name: 'Urinalysis (dipstick)', category: 'Urinalysis', sampleType: 'Urine', sampleTube: 'Sterile container', unit: '—', referenceRange: 'Leukocytes · nitrite · protein · glucose', turnaroundHours: 6 },
      { name: 'Urine Culture & Sensitivity', category: 'Microbiology', sampleType: 'Urine', sampleTube: 'Sterile container', unit: 'CFU/mL', referenceRange: 'No significant growth (<10⁴ CFU/mL)', turnaroundHours: 72 },
      { name: 'CRP (quantitative)', category: 'Immunology', sampleType: 'Blood', sampleTube: 'Plain', unit: 'mg/L', referenceRange: '< 3.0', turnaroundHours: 12 },
      { name: 'PSA Total', category: 'Hormones', sampleType: 'Blood', sampleTube: 'Plain', unit: 'ng/mL', referenceRange: '< 4.0', turnaroundHours: 24 },
      { name: 'Vitamin D (25-OH)', category: 'Hormones', sampleType: 'Blood', sampleTube: 'Plain', unit: 'ng/mL', referenceRange: '30–100', turnaroundHours: 48 },
    ];

    let testCount = 0;
    const testIds: Record<string, string> = {};
    for (const t of labTests) {
      const [row] = await qr.query(`
        INSERT INTO lab_tests (id, clinic_id, name, category, sample_type, sample_tube, unit, reference_range, turnaround_hours, is_active)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT (clinic_id, name) DO UPDATE SET
          category = EXCLUDED.category,
          sample_type = EXCLUDED.sample_type,
          sample_tube = EXCLUDED.sample_tube,
          unit = EXCLUDED.unit,
          reference_range = EXCLUDED.reference_range,
          turnaround_hours = EXCLUDED.turnaround_hours,
          is_active = true
        RETURNING id
      `, [clinicId, t.name, t.category, t.sampleType, t.sampleTube, t.unit, t.referenceRange, t.turnaroundHours]);
      testIds[t.name] = row.id;
      testCount++;
    }

    // Two demo requests: #1 completed with results, #2 still in progress.
    const [seededOwner] = await qr.query(
      `SELECT id FROM users WHERE clinic_id = $1 AND email = $2 LIMIT 1`,
      [clinicId, process.env.SEED_CLINIC_OWNER_EMAIL || 'owner@demo.yourplatform.com'],
    );
    let patients: any[] = await qr.query(
      `SELECT id FROM patients WHERE clinic_id = $1 ORDER BY created_at LIMIT 2`,
      [clinicId],
    );

    // If the clinic has no patients yet, seed one demo patient so the lab
    // demo requests have someone to attach to (idempotent via PAT sequence).
    if (patients.length === 0 && seededOwner) {
      const [seq] = await qr.query(
        `SELECT current_value FROM tenant_sequences
         WHERE clinic_id = $1 AND sequence_type = 'PATIENT' FOR UPDATE`,
        [clinicId],
      );
      const nextVal = (parseInt(seq?.current_value ?? '0', 10) || 0) + 1;
      await qr.query(
        `UPDATE tenant_sequences SET current_value = $2, updated_at = now()
         WHERE clinic_id = $1 AND sequence_type = 'PATIENT'`,
        [clinicId, String(nextVal)],
      );
      await qr.query(
        `INSERT INTO patients (id, clinic_id, patient_number, first_name, last_name, gender, phone, status)
         VALUES (uuid_generate_v4(), $1, $2, 'Demo', 'Patient', 'male', '+201000000000', 'active')
         ON CONFLICT (clinic_id, patient_number) DO NOTHING`,
        [clinicId, `PAT-${String(nextVal).padStart(4, '0')}`],
      );
      patients = await qr.query(
        `SELECT id FROM patients WHERE clinic_id = $1 ORDER BY created_at LIMIT 2`,
        [clinicId],
      );
    }

    let labRequestCount = 0;
    if (patients.length >= 1 && seededOwner) {
      const year = new Date().getFullYear();
      const demos = [
        {
          requestNumber: `LAB-${year}-00001`,
          patientId: patients[0 % patients.length].id,
          priority: 'routine',
          notes: 'Routine annual screening (CBC, lipids, fasting glucose)',
          items: [
            { test: 'Complete Blood Count (CBC)', value: '12.8', unit: 'g/dL', flag: 'normal', notes: 'Hb within reference' },
            { test: 'Lipid Profile', value: '118', unit: 'mg/dL', flag: 'high', notes: 'LDL elevated — lifestyle counselling advised' },
            { test: 'Fasting Blood Glucose', value: '94', unit: 'mg/dL', flag: 'normal', notes: null },
          ],
          completed: true,
        },
        {
          requestNumber: `LAB-${year}-00002`,
          patientId: patients[1 % patients.length].id,
          priority: 'urgent',
          notes: 'Suspected thyroid imbalance — verify before dose change',
          items: [
            { test: 'TSH', value: null, unit: null, flag: null, notes: null },
            { test: 'Vitamin D (25-OH)', value: null, unit: null, flag: null, notes: null },
          ],
          completed: false,
        },
      ];

      for (const demo of demos) {
        const demoPatientId = patients[demos.indexOf(demo) % patients.length].id;
        const [header] = await qr.query(`
          INSERT INTO lab_requests
            (id, clinic_id, patient_id, visit_id, request_number, requested_by, status, priority, clinical_notes, lab_technician)
          VALUES (uuid_generate_v4(), $1, $2, NULL, $3, $4, $5, $6, $7, $4)
          ON CONFLICT (clinic_id, request_number) DO NOTHING
          RETURNING id
        `, [
          clinicId, demoPatientId, demo.requestNumber, seededOwner.id,
          demo.completed ? 'completed' : 'collected',
          demo.priority, demo.notes,
        ]);
        if (!header) continue; // already seeded → keep user's modifications

        for (const it of demo.items) {
          await qr.query(`
            INSERT INTO lab_request_items (id, clinic_id, request_id, test_id, status, result_value, result_unit, result_flag, result_notes, resulted_by, resulted_at)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (request_id, test_id) DO NOTHING
          `, [
            clinicId, header.id, testIds[it.test],
            it.value ? 'completed' : 'collected',
            it.value, it.unit, it.flag, it.notes, seededOwner.id,
            it.value ? new Date() : null,
          ]);
        }
        labRequestCount++;
      }

      // Keep the LAB sequence past any demo numbers so the first user-created
      // request (LAB-YYYY-00003…) does not collide with the seeded demos.
      let maxSeededSuffix = 0;
      for (const demo of demos) {
        const suffix = parseInt(demo.requestNumber.split('-').pop() || '0', 10);
        if (suffix > maxSeededSuffix) maxSeededSuffix = suffix;
      }
      await qr.query(
        `UPDATE tenant_sequences SET current_value = GREATEST(current_value, $2::bigint), updated_at = now()
         WHERE clinic_id = $1 AND sequence_type = 'LAB'`,
        [clinicId, String(maxSeededSuffix)],
      );
    }
    console.log(`   ✓ ${testCount} lab tests, ${labRequestCount} demo lab requests seeded`);

    // ─── Step 13: Reminder Templates, Settings & Demo Outbox ────────────────
    console.log('\n🔔 Step 13: Reminders & Messaging');

    await qr.query(
      `INSERT INTO reminder_settings (clinic_id) VALUES ($1)
       ON CONFLICT (clinic_id) DO NOTHING`,
      [clinicId],
    );

    const reminderTemplates: Array<{
      key: string;
      channel: string;
      name: string;
      body: string;
    }> = [
      {
        key: 'appointment_reminder',
        channel: 'sms',
        name: 'Appointment Reminder (SMS)',
        body: 'Hi {{patient_name}}, reminder of your appointment at {{clinic_name}} on {{date}} at {{time}}. Call us if you need to reschedule.',
      },
      {
        key: 'appointment_reminder',
        channel: 'whatsapp',
        name: 'Appointment Reminder (WhatsApp)',
        body: 'Hi {{patient_name}}, this is a reminder of your appointment at {{clinic_name}} on {{date}} at {{time}}. Reply to this message if you need to reschedule.',
      },
    ];
    for (const t of reminderTemplates) {
      await qr.query(
        `INSERT INTO notification_templates (id, clinic_id, key, channel, name, body)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
         ON CONFLICT (clinic_id, key, channel) DO NOTHING`,
        [clinicId, t.key, t.channel, t.name, t.body],
      );
    }

    // Demo outbox rows (one sent, one failed) so the Reminders screen shows
    // real states — only on first seed, so re-runs stay idempotent.
    const [hasOutbox] = await qr.query(
      `SELECT 1 AS present FROM notifications WHERE clinic_id = $1 LIMIT 1`,
      [clinicId],
    );
    let demoOutbox = 0;
    if (!hasOutbox) {
      const [demoPatient] = await qr.query(
        `SELECT id, phone FROM patients
         WHERE clinic_id = $1 AND deleted_at IS NULL
         ORDER BY created_at LIMIT 1`,
        [clinicId],
      );
      const demoRecipient: string = demoPatient?.phone || '+201000000000';
      await qr.query(
        `INSERT INTO notifications
           (id, clinic_id, patient_id, template_key, channel, recipient, body, status,
            provider, provider_message_id, attempts, scheduled_at, sent_at, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, 'appointment_reminder', 'whatsapp', $3, $4, 'sent',
                 'console', 'demo-whatsapp-0001', 1, now() - interval '1 hour',
                 now() - interval '1 hour', now() - interval '1 hour', now() - interval '1 hour')`,
        [
          clinicId,
          demoPatient?.id ?? null,
          demoRecipient,
          'Hi, this is a reminder of your appointment on 2026-01-15 at 10:00 at our clinic. (demo)',
        ],
      );
      await qr.query(
        `INSERT INTO notifications
           (id, clinic_id, patient_id, template_key, channel, recipient, body, status,
            provider, error, attempts, scheduled_at, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, 'appointment_reminder', 'sms', $3, $4, 'failed',
                 'console', 'Provider rejected the destination number (demo)', 3,
                 now() - interval '2 hours', now() - interval '2 hours', now() - interval '2 hours')`,
        [
          clinicId,
          demoPatient?.id ?? null,
          demoRecipient,
          'Hi, reminder of your appointment at our clinic. (demo)',
        ],
      );
      demoOutbox = 2;
    }

    console.log(
      `   ✓ ${reminderTemplates.length} reminder templates, 1 settings row, ${demoOutbox} demo outbox messages seeded`,
    );

    // Ensure one demo FAILED row exists — the manual-retry demo (and its E2E)
    // consume it by flipping it to 'sent', so every seed run restores it.
    const [hasFailedRow] = await qr.query(
      `SELECT 1 AS present FROM notifications WHERE clinic_id = $1 AND status = 'failed' LIMIT 1`,
      [clinicId],
    );
    if (!hasFailedRow) {
      const [failPatient] = await qr.query(
        `SELECT id, phone FROM patients
         WHERE clinic_id = $1 AND deleted_at IS NULL
         ORDER BY created_at LIMIT 1`,
        [clinicId],
      );
      await qr.query(
        `INSERT INTO notifications
           (id, clinic_id, patient_id, template_key, channel, recipient, body, status,
            provider, error, attempts, scheduled_at, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, 'appointment_reminder', 'whatsapp', $3,
                 'Hi, this is a reminder of your appointment at our clinic. (demo)',
                 'failed', 'console', 'Simulated delivery failure (demo)', 1,
                 now(), now(), now())`,
        [clinicId, failPatient?.id ?? null, failPatient?.phone || '+201000000000'],
      );
      console.log('   ✓ demo failed outbox row restored (retry demo)');
    }

    // ─── Step 14: Demo Telemedicine Visit (Phase A5) ───────────────────────────
    console.log('\n🎥 Step 14: Demo Telemedicine Visit');
    const [telemedPatient] = await qr.query(
      `SELECT id FROM patients
       WHERE clinic_id = $1 AND deleted_at IS NULL
       ORDER BY created_at LIMIT 1`,
      [clinicId],
    );
    const [telemedProvider] = await qr.query(
      `SELECT id FROM users WHERE clinic_id = $1 ORDER BY created_at LIMIT 1`,
      [clinicId],
    );
    const [telemedService] = await qr.query(
      `SELECT id, default_duration_minutes FROM clinic_services
       WHERE clinic_id = $1 AND is_active = true
       ORDER BY sort_order LIMIT 1`,
      [clinicId],
    );
    const [hasTelemed] = await qr.query(
      `SELECT 1 AS present FROM appointments
       WHERE clinic_id = $1 AND room_code = 'RM-DEMO1' LIMIT 1`,
      [clinicId],
    );
    if (!hasTelemed && telemedPatient?.id && telemedProvider?.id) {
      await qr.query(
        `INSERT INTO appointments (
           id, clinic_id, patient_id, provider_id, service_id,
           start_time, end_time, status, notes, created_by, visit_type, room_code
         ) VALUES (
           uuid_generate_v4(), $1, $2, $3, $4,
           date_trunc('day', now()) + interval '1 day' + interval '10 hours',
           date_trunc('day', now()) + interval '1 day' + interval '10 hours'
             + (COALESCE($5, 30)::text || ' minutes')::interval,
           'scheduled', 'Telemedicine follow-up visit (demo)', NULL, 'telemedicine', 'RM-DEMO1'
         )`,
        [
          clinicId,
          telemedPatient.id,
          telemedProvider.id,
          telemedService?.id ?? null,
          telemedService?.default_duration_minutes ?? 30,
        ],
      );
      console.log('   ✓ Demo telemedicine appointment tomorrow 10:00 (room RM-DEMO1)');
    } else {
      console.log('   → Demo telemedicine appointment already present, skipped');
    }

    // ─── Step 15: Demo Vitals Series (Phase A6) ──────────────────────────────
    console.log('\n📈 Step 15: Vitals Trends');
    const [vitalsPatient] = await qr.query(
      `SELECT id FROM patients
       WHERE clinic_id = $1 AND deleted_at IS NULL
       ORDER BY created_at LIMIT 1`,
      [clinicId],
    );
    const [vitalsProvider] = await qr.query(
      `SELECT id FROM users WHERE clinic_id = $1 ORDER BY created_at LIMIT 1`,
      [clinicId],
    );
    const [hasVitals] = await qr.query(
      `SELECT 1 AS present FROM visit_measurements
       WHERE clinic_id = $1 AND notes = 'demo vitals series' LIMIT 1`,
      [clinicId],
    );
    if (!hasVitals && vitalsPatient?.id && vitalsProvider?.id) {
      // One demo clinical visit so the oldest reading of each series hangs off
      // a real visit; the remaining readings are standalone (visit_id NULL).
      const demoVisitRows = await qr.query(
        `INSERT INTO visits (id, clinic_id, patient_id, provider_id, original_visit_date)
         VALUES (uuid_generate_v4(), $1, $2, $3, now() - interval '35 days')
         RETURNING id`,
        [clinicId, vitalsPatient.id, vitalsProvider.id],
      );
      const demoVisitId = demoVisitRows?.[0]?.id ?? null;

      const vitalsSeries: Array<[string, number[], string]> = [
        ['weight', [82.4, 81.8, 81.5, 80.9, 80.6, 80.1], 'kg'],
        ['bp_systolic', [138, 135, 136, 132, 130, 128], 'mmHg'],
        ['bp_diastolic', [88, 86, 87, 84, 83, 82], 'mmHg'],
        ['heart_rate', [84, 82, 85, 79, 78, 76], 'bpm'],
        ['temperature', [37.1, 36.8, 36.9, 36.7, 36.6, 36.6], '°C'],
        ['spo2', [96, 97, 96, 98, 97, 98], '%'],
        ['blood_glucose', [118, 112, 115, 108, 104, 101], 'mg/dL'],
        ['pain_score', [6, 5, 5, 3, 3, 2], 'score'],
      ];
      let readingCount = 0;
      for (const [key, values, unit] of vitalsSeries) {
        for (let i = 0; i < values.length; i++) {
          const weeksAgo = values.length - 1 - i; // oldest first, newest = now-ish
          await qr.query(
            `INSERT INTO visit_measurements
               (id, clinic_id, patient_id, visit_id, key, value, unit, notes, recorded_at)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'demo vitals series', $7)`,
            [
              clinicId,
              vitalsPatient.id,
              i === 0 ? demoVisitId : null,
              key,
              values[i],
              unit,
              new Date(Date.now() - weeksAgo * 604800000).toISOString(),
            ],
          );
          readingCount++;
        }
      }
      console.log(
        `   ✓ Demo vitals: ${vitalsSeries.length} keys × ${vitalsSeries[0][1].length} readings (${readingCount}) + demo visit`,
      );
    } else {
      console.log('   ➕ Demo vitals series already present, skipped');
    }

    await qr.commitTransaction();

    console.log('\n✅ Seed completed successfully!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('  Platform Admin:');
    console.log(`    Email:    ${process.env.SEED_ADMIN_EMAIL || 'admin@yourplatform.com'}`);
    console.log(`    Password: ${process.env.SEED_ADMIN_PASSWORD || 'ChangeMe#Admin2026!'}`);
    console.log('  Demo Clinic Owner (subdomain: demo):');
    console.log(`    Email:    ${process.env.SEED_CLINIC_OWNER_EMAIL || 'owner@demo.yourplatform.com'}`);
    console.log(`    Password: ${process.env.SEED_CLINIC_OWNER_PASSWORD || 'Demo#Owner2026!'}`);
    console.log('═══════════════════════════════════════════════');
    console.log('  ⚠️  Change all passwords immediately in production!');
    console.log('═══════════════════════════════════════════════\n');

  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\n❌ Seed failed — transaction rolled back:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seed();
