/**
 * Clinic Management Platform — Demo Data Seeder
 *
 * Seeds realistic *operational* demo data for one clinic so every screen in the
 * product has something meaningful to show:
 *
 *   • 30 female patients (Arabic names) with full profiles
 *   • allergies, chronic conditions, current medications, family history
 *   • signed consent records and uploaded patient files
 *   • appointments spread across last month → next two weeks
 *   • finalized visits with versions, diagnoses and measurements
 *   • prescriptions (with items drawn from the seeded drug catalog)
 *   • invoices + line items with realistic payment states
 *   • before/after clinical photography records
 *   • stock consumption movements linked to the procedures performed
 *   • audit-log trail
 *
 * Idempotency: guarded by a marker row in `audit_logs`
 * (action = 'demo:seed'). Set FORCE_DEMO_RESEED=1 to wipe the demo patients
 * and rebuild from scratch.
 *
 * Usage:
 *   pnpm --filter @clinic/api demo:seed
 */

import 'reflect-metadata';
import { AppDataSource } from './data-source';

const DEMO_MARKER = 'demo:seed';
const FORCE = process.env.FORCE_DEMO_RESEED === '1';

// ── Deterministic PRNG so re-running produces the same demo ────────────────
let seedState = 20260422;
function rnd(): number {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function int(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}
function bool(p = 0.5): boolean {
  return rnd() < p;
}

const DAY = 86_400_000;

/** Local-time Date on the clinic's day offset from today, at hh:mm. */
function dayAt(offsetDays: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Date(d.getTime() + offsetDays * DAY);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ───────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'مريم', 'سارة', 'نور', 'هبة', 'ياسمين', 'دينا', 'أميرة', 'رنا', 'لمياء', 'شيماء',
  'منة', 'جنى', 'روان', 'سلمى', 'فرح', 'مي', 'ندى', 'آية', 'إيمان', 'بسنت',
  'حبيبة', 'رقية', 'سندس', 'تسنيم', 'ملك', 'لينا', 'جويل', 'مارينا', 'هند', 'أسماء',
];

const LAST_NAMES = [
  'أحمد', 'محمود', 'حسن', 'إبراهيم', 'خالد', 'سعيد', 'فؤاد', 'عبد الرحمن', 'شوقي', 'زكي',
  'منصور', 'فتحي', 'الشريف', 'رمضان', 'بدر', 'سلامة', 'جابر', 'الزناتي', 'عوض', 'سمير',
];

const SERVICES = [
  'Aesthetic & Dermatology Consultation',
  'Botox Anti-Wrinkle Injection (Full Upper Face)',
  'Hyaluronic Acid Dermal Filler (1ml)',
  'Candela Laser Hair Removal (Full Body)',
  'Hydrafacial Syndeo Deep Cleansing & Infusion',
  'Medical Chemical Glow Peel',
  'Morpheus8 RF Microneedling Session',
  'Dermapen Microneedling with PRP / Exosomes',
  'Full-Body Digital Mole Mapping & Dermoscopy',
  'Post-Procedure Follow-Up & Touch-Up',
];

const COMPLAINTS = [
  'شكوى من حبوب متكررة في الوجه مع مسام واسعة',
  'تساقط شعر بالرأس مع خفة في مقدمة الرأس',
  'تصبغات وكروم جلدية بعد الحمل',
  'رغبة في إزالة الشعر الزائد بالجسم بالليزر',
  'علامات تقدم السن وخطوط دقيقة حول العين',
  'جفاف شديد بالبشرة مع احمرار متكرر',
  'ندبات حب الشباب القديمة على الوجنتين',
  'ترهل بسيط بالوجه والرقبة مع فقدان نضارة',
];

const DIAGNOSES = [
  'Acne vulgaris (moderate)',
  'Androgenetic alopecia',
  'Melasma · Fitzpatrick IV',
  'Hirsutism — idiopathic',
  'Photoaging · Glogau III',
  'Atopic dermatitis (mild)',
  'Post-acne atrophic scarring',
  'Facial skin laxity',
];

const TREATMENT_PLANS = [
  '٤ جلسات Hydrafacial كل أسبوعين مع روتين تقشير ليلي',
  'جلسة Botox للجبهة والحاجب + متابعة بعد أسبوعين',
  '٨ جلسات ليزر Full Body كل ٥ أسابيع + واقي شمس SPF50',
  '٣ جلسات Morpheus8 مع Cocktail فيتامين سي',
  'جلسة Chemical Peel + علاج موضعي للتفتيح',
  'جلسات Dermapen مع PRP شهرياً لمدة ٤ أشهر',
];

const ALLERGENS = [
  { allergen: 'البنسلين', allergy_type: 'medication', reaction: 'طفح جلدي وحكة', severity: 'moderate' },
  { allergen: 'Lidocaine', allergy_type: 'medication', reaction: 'احمرار موضعي وتورم', severity: 'severe' },
  { allergen: 'حبوب اللقاح', allergy_type: 'environmental', reaction: 'رشح وحكة بالعين', severity: 'mild' },
  { allergen: 'الأسبرين', allergy_type: 'medication', reaction: 'ضيق تنفس بسيط', severity: 'moderate' },
  { allergen: 'Latex', allergy_type: 'environmental', reaction: 'التهاب جلدي تلامسي', severity: 'moderate' },
];

const CONDITIONS = [
  { name: 'Polycystic ovary syndrome', icd_code: 'E28.2', severity: 'moderate' },
  { name: 'Iron deficiency anaemia', icd_code: 'D50.9', severity: 'mild' },
  { name: 'Hypothyroidism', icd_code: 'E03.9', severity: 'moderate' },
  { name: 'Type 2 diabetes mellitus', icd_code: 'E11.9', severity: 'moderate' },
  { name: 'Hypertension', icd_code: 'I10', severity: 'mild' },
  { name: 'Vitamin D deficiency', icd_code: 'E55.9', severity: 'mild' },
];

const MEDICATIONS = [
  { name: 'Glucophage', generic_name: 'Metformin', dose: '500', unit: 'mg', frequency: 'مرتين يومياً', route: 'oral' },
  { name: 'Euthyrox', generic_name: 'Levothyroxine', dose: '50', unit: 'mcg', frequency: 'مرة يومياً صباحاً', route: 'oral' },
  { name: 'Zyrtec', generic_name: 'Cetirizine', dose: '10', unit: 'mg', frequency: 'مرة يومياً ليلاً', route: 'oral' },
  { name: 'Vitamin D3', generic_name: 'Cholecalciferol', dose: '2000', unit: 'IU', frequency: 'مرة يومياً', route: 'oral' },
  { name: 'Skinoren', generic_name: 'Azelaic Acid', dose: '', unit: 'cream', frequency: 'مرتين يومياً على الوجه', route: 'topical' },
  { name: 'Differin', generic_name: 'Adapalene', dose: '0.1', unit: '%', frequency: 'مرة ليلاً على بشرة جافة', route: 'topical' },
];

const FAMILY = [
  { relative: 'الأب', condition: 'ارتفاع ضغط الدم' },
  { relative: 'الأم', condition: 'سكري من النوع الثاني' },
  { relative: 'الأخت', condition: 'تكيس المبايض' },
  { relative: 'الجد', condition: 'أمراض القلب' },
  { relative: 'الأم', condition: 'سرطان الثدي — تم الشفاء' },
];

type PatientSeed = {
  id: string;
  number: string;
  firstName: string;
  lastName: string;
  full: string;
  phone: string;
};

async function seed() {
  console.log('🎬 Connecting to database...');
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ── 0. Resolve clinic + staff ──────────────────────────────────────────
    const slug = process.env.SEED_CLINIC_SLUG || 'entrustic-beauty';
    const [clinic] = await qr.query(
      `SELECT id, name, currency FROM clinics WHERE slug = $1`,
      [slug],
    );
    if (!clinic) throw new Error(`Clinic "${slug}" not found — run the base seed first.`);
    const clinicId: string = clinic.id;

    await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [clinicId]);

    const staff = await qr.query(
      `SELECT u.id, u.first_name, u.last_name, r.name AS role
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.clinic_id = $1 AND u.deleted_at IS NULL
       ORDER BY u.created_at`,
      [clinicId],
    );
    if (staff.length === 0) throw new Error('No staff users found — run the base seed first.');
    const providerIds: string[] = staff.map((s: any) => s.id);

    // ── Guard: already seeded? ─────────────────────────────────────────────
    const [marker] = await qr.query(
      `SELECT 1 AS present FROM audit_logs WHERE clinic_id = $1 AND action = $2 LIMIT 1`,
      [clinicId, DEMO_MARKER],
    );
    if (marker && !FORCE) {
      await qr.rollbackTransaction();
      console.log('ℹ️  Demo data already present — nothing to do.');
      console.log('   (set FORCE_DEMO_RESEED=1 to wipe and rebuild)');
      return;
    }

    if (FORCE) {
      console.log('\n🧹 FORCE_DEMO_RESEED=1 — wiping existing demo rows...');
      // ON DELETE CASCADE removes appointments, visits, invoices, records, etc.
      await qr.query(`DELETE FROM patients WHERE clinic_id = $1`, [clinicId]);
      await qr.query(`DELETE FROM audit_logs WHERE clinic_id = $1`, [clinicId]);
      await qr.query(`DELETE FROM notifications WHERE clinic_id = $1`, [clinicId]);
    }

    // ── Existing demo patient from the base seed: replace it ───────────────
    await qr.query(
      `DELETE FROM patients WHERE clinic_id = $1 AND first_name = 'Demo'`,
      [clinicId],
    );

    const services: any[] = await qr.query(
      `SELECT id, name, current_price, default_duration_minutes FROM clinic_services
       WHERE clinic_id = $1 AND is_active = true ORDER BY sort_order`,
      [clinicId],
    );
    const svc = (name: string) => services.find((s) => s.name === name) ?? services[0];

    const drugs: any[] = await qr.query(
      `SELECT id, name FROM drugs WHERE clinic_id = $1 ORDER BY name`,
      [clinicId],
    );
    const drugByName = (name: string) => drugs.find((d) => d.name === name);

    const inventory: any[] = await qr.query(
      `SELECT id, name, unit FROM inventory_items WHERE clinic_id = $1 ORDER BY name`,
      [clinicId],
    );

    // ── 1. Patients ────────────────────────────────────────────────────────
    console.log('\n👩 Step 1: Female patient roster');
    const [seqRow] = await qr.query(
      `SELECT current_value FROM tenant_sequences
       WHERE clinic_id = $1 AND sequence_type = 'PATIENT' FOR UPDATE`,
      [clinicId],
    );
    let patSeq = parseInt(seqRow?.current_value ?? '0', 10) || 0;

    const PATIENT_COUNT = 30;
    const patients: PatientSeed[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < PATIENT_COUNT; i++) {
      let first = pick(FIRST_NAMES);
      let last = pick(LAST_NAMES);
      let guard = 0;
      while (usedNames.has(`${first} ${last}`) && guard++ < 50) {
        first = pick(FIRST_NAMES);
        last = pick(LAST_NAMES);
      }
      usedNames.add(`${first} ${last}`);

      patSeq++;
      const number = `PAT-${String(patSeq).padStart(4, '0')}`;
      const age = int(19, 56);
      const dob = new Date(Date.now() - age * 365.25 * DAY);
      // Spread registration over the last ~14 months.
      const createdAt = new Date(Date.now() - int(10, 420) * DAY);

      const [row] = await qr.query(
        `INSERT INTO patients (
           id, clinic_id, patient_number, first_name, last_name, date_of_birth, gender,
           phone, email, address, emergency_contact_name, emergency_contact_phone,
           blood_type, allergies, notes, status, created_at, updated_at
         ) VALUES (
           uuid_generate_v4(), $1, $2, $3, $4, $5, 'female',
           $6, $7, $8, $9, $10,
           $11, $12, $13, 'active', $14, $14
         )
         ON CONFLICT (clinic_id, patient_number) DO UPDATE
           SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
         RETURNING id`,
        [
          clinicId,
          number,
          first,
          last,
          isoDate(dob),
          `+201${int(0, 2)}${int(10000000, 99999999)}`,
          bool(0.7) ? `patient${i + 1}@demo.entrusticbeauty.app` : null,
          pick([
            'المعادي، القاهرة',
            'مدينة نصر، القاهرة',
            'الزمالك، القاهرة',
            'سموحة، الإسكندرية',
            'الشيخ زايد، الجيزة',
            'المنصورة، الدقهلية',
          ]),
          pick(['الزوج', 'الأم', 'الأخت', 'الأب']),
          `+201${int(0, 2)}${int(10000000, 99999999)}`,
          pick(['A+', 'O+', 'B+', 'AB+', 'A-', 'O-']),
          bool(0.35) ? pick(ALLERGENS).allergen : null,
          bool(0.2) ? 'عميلة دائمة — تفضل المواعيد المسائية' : null,
          createdAt,
        ],
      );
      patients.push({ id: row.id, number, firstName: first, lastName: last, full: `${first} ${last}`, phone: '' });
    }
    console.log(`   ✓ ${patients.length} female patients created`);

    await qr.query(
      `UPDATE tenant_sequences SET current_value = $2, updated_at = now()
       WHERE clinic_id = $1 AND sequence_type = 'PATIENT'`,
      [clinicId, String(patSeq)],
    );

    // ── 2. Patient clinical background ─────────────────────────────────────
    console.log('\n🩺 Step 2: Allergies, conditions, medications, family history');
    let allergyN = 0;
    let conditionN = 0;
    let medN = 0;
    let famN = 0;

    for (const p of patients) {
      const doc = pick(providerIds);

      for (let i = 0; i < int(0, 2); i++) {
        const a = pick(ALLERGENS);
        await qr.query(
          `INSERT INTO patient_allergies
             (id, clinic_id, patient_id, allergen, allergy_type, reaction, severity, status, onset_date, notes, created_by)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'active', $7, NULL, $8)`,
          [
            clinicId, p.id, a.allergen, a.allergy_type, a.reaction, a.severity,
            isoDate(new Date(Date.now() - int(200, 3000) * DAY)), doc,
          ],
        );
        allergyN++;
      }

      for (let i = 0; i < int(0, 2); i++) {
        const c = pick(CONDITIONS);
        await qr.query(
          `INSERT INTO patient_conditions
             (id, clinic_id, patient_id, name, icd_code, status, severity, onset_date, notes, created_by)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NULL, $8)`,
          [
            clinicId, p.id, c.name, c.icd_code,
            bool(0.8) ? 'active' : 'resolved', c.severity,
            isoDate(new Date(Date.now() - int(300, 4000) * DAY)), doc,
          ],
        );
        conditionN++;
      }

      for (let i = 0; i < int(0, 2); i++) {
        const m = pick(MEDICATIONS);
        await qr.query(
          `INSERT INTO patient_medications
             (id, clinic_id, patient_id, name, generic_name, dose, unit, frequency, route,
              start_date, is_current, prescribed_by, reason, created_by)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            clinicId, p.id, m.name, m.generic_name, m.dose, m.unit, m.frequency, m.route,
            isoDate(new Date(Date.now() - int(30, 900) * DAY)),
            i === 0, 'طبيب خارجي', pick(['متابعة حالة مزمنة', 'علاج حالي']), doc,
          ],
        );
        medN++;
      }

      if (bool(0.55)) {
        const f = pick(FAMILY);
        await qr.query(
          `INSERT INTO family_history
             (id, clinic_id, patient_id, relative, condition, notes, created_by)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, NULL, $5)`,
          [clinicId, p.id, f.relative, f.condition, doc],
        );
        famN++;
      }
    }
    console.log(`   ✓ ${allergyN} allergies, ${conditionN} conditions, ${medN} medications, ${famN} family history rows`);

    // ── 3. Appointments ────────────────────────────────────────────────────
    console.log('\n📅 Step 3: Appointments (last month → next two weeks)');
    const appointments: Array<{ id: string; patient: PatientSeed; service: any; start: Date; provider: string; status: string }> = [];

    const [hasRows] = await qr.query(
      `SELECT 1 AS present FROM appointments WHERE clinic_id = $1 LIMIT 1`,
      [clinicId],
    );

    if (!hasRows) {
      const OPEN_HOURS = [10, 11, 12, 13, 16, 17, 18, 19, 20];

      for (let offset = -30; offset <= 14; offset++) {
        const dow = new Date(Date.now() + offset * DAY).getDay();
        if (dow === 5) continue; // Friday — clinic closed
        const perDay = offset <= 0 ? int(2, 5) : int(1, 3);

        for (let n = 0; n < perDay; n++) {
          const patient = pick(patients);
          const service = pick(services);
          const hour = pick(OPEN_HOURS);
          const start = dayAt(offset, hour, bool(0.3) ? 30 : 0);
          const end = new Date(start.getTime() + (service.default_duration_minutes || 30) * 60_000);
          const provider = pick(providerIds);

          let status: string;
          if (offset < 0) status = bool(0.86) ? 'completed' : bool(0.5) ? 'no_show' : 'cancelled';
          else if (offset === 0) status = pick(['confirmed', 'confirmed', 'completed', 'in_progress', 'scheduled']);
          else status = bool(0.7) ? 'scheduled' : 'confirmed';

          const [row] = await qr.query(
            `INSERT INTO appointments
               (id, clinic_id, patient_id, provider_id, service_id, start_time, end_time,
                status, notes, cancellation_reason, visit_type, created_by, created_at, updated_at)
             VALUES (
               uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_person', $3, $10, $10
             )
             RETURNING id`,
            [
              clinicId, patient.id, provider, service.id, start, end, status,
              bool(0.4) ? pick(COMPLAINTS) : null,
              status === 'cancelled' ? pick(['ظروف شخصية', 'تعارض في الموعد', 'سفر']) : null,
              new Date(start.getTime() - int(2, 21) * DAY),
            ],
          );
          appointments.push({ id: row.id, patient, service, start, provider, status });
        }
      }
      console.log(`   ✓ ${appointments.length} appointments (completed / today / upcoming / cancelled)`);
    } else {
      console.log('   → appointments already present, skipped');
    }

    // ── 4. Visits + versions + diagnoses + measurements ───────────────────
    console.log('\n📋 Step 4: Finalized visits with clinical documentation');
    let visitN = 0;
    let diagnosisN = 0;
    let measurementN = 0;

    const completed = appointments.filter((a) => a.status === 'completed');
    for (const appt of completed) {
      const [visit] = await qr.query(
        `INSERT INTO visits
           (id, clinic_id, patient_id, provider_id, appointment_id, original_visit_date, status, current_version, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'finalized', 1, $5, $5)
         RETURNING id`,
        [clinicId, appt.patient.id, appt.provider, appt.id, appt.start],
      );
      visitN++;
      const visitId: string = visit.id;

      const complaint = pick(COMPLAINTS);
      const diagnosis = pick(DIAGNOSES);
      const plan = pick(TREATMENT_PLANS);

      await qr.query(
        `INSERT INTO visit_versions
           (id, clinic_id, visit_id, version_number, chief_complaint, diagnosis, treatment_plan,
            clinical_notes, follow_up_date, custom_fields, changed_by, changed_at)
         VALUES (uuid_generate_v4(), $1, $2, 1, $3, $4, $5, $6, $7, '{}', $8, $9)`,
        [
          clinicId, visitId, complaint, diagnosis, plan,
          'الحالة مستقرة، لا توجد أعراض جانبية. تم شرح التعليمات بعد الجلسة.',
          isoDate(new Date(appt.start.getTime() + int(14, 42) * DAY)),
          appt.provider,
          appt.start,
        ],
      );

      await qr.query(
        `INSERT INTO visit_diagnoses
           (id, clinic_id, visit_id, code, description, is_primary, notes, created_at)
         VALUES (uuid_generate_v4(), $1, $2, NULL, $3, true, NULL, $4)`,
        [clinicId, visitId, diagnosis, appt.start],
      );
      diagnosisN++;

      if (bool(0.6)) {
        await qr.query(
          `INSERT INTO visit_diagnoses
             (id, clinic_id, visit_id, code, description, is_primary, notes, created_at)
           VALUES (uuid_generate_v4(), $1, $2, NULL, $3, false, NULL, $4)`,
          [clinicId, visitId, pick(['Vitamin D deficiency', 'Mild dehydration of skin', 'Seborrhoeic tendencies']), appt.start],
        );
        diagnosisN++;
      }

      // Clinical measurements — the same keys the Vitals Trends view charts.
      const measurements: Array<[string, number, string]> = [
        ['weight', Math.round((52 + rnd() * 30) * 10) / 10, 'kg'],
        ['bp_systolic', int(108, 136), 'mmHg'],
        ['bp_diastolic', int(66, 88), 'mmHg'],
        ['heart_rate', int(62, 92), 'bpm'],
        ['temperature', Math.round((36.4 + rnd() * 0.7) * 10) / 10, '°C'],
        ['spo2', int(96, 99), '%'],
      ];
      for (const [key, value, unit] of measurements) {
        await qr.query(
          `INSERT INTO visit_measurements
             (id, clinic_id, patient_id, visit_id, key, value, unit, notes, recorded_at)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NULL, $7)`,
          [clinicId, appt.patient.id, visitId, key, value, unit, appt.start],
        );
        measurementN++;
      }

      // Signed consent for the procedure performed.
      await qr.query(
        `INSERT INTO consent_records
           (id, clinic_id, patient_id, visit_id, consent_type, title, content, method, status, signed_at, witness, created_by, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, 'procedure', $4, $5, 'digital', 'given', $6, $7, $8, $6)`,
        [
          clinicId, appt.patient.id, visitId,
          `موافقة مستنيرة — ${appt.service.name}`,
          'تم شرح طبيعة الإجراء والفوائد والمخاطر المحتملة والبدائل، ووافقت العميلة على إتمام الجلسة.',
          appt.start,
          'Reception Desk', appt.provider,
        ],
      );

      // Link the visit onto the appointment for a coherent timeline.
      await qr.query(`UPDATE appointments SET updated_at = updated_at WHERE id = $1`, [appt.id]);
    }
    console.log(`   ✓ ${visitN} visits, ${diagnosisN} diagnoses, ${measurementN} measurements`);

    // ── 5. Prescriptions ───────────────────────────────────────────────────
    console.log('\n💊 Step 5: Prescriptions from the drug catalog');
    let prescriptionN = 0;
    let prescriptionItemN = 0;

    const visitsForRx: any[] = await qr.query(
      `SELECT id, patient_id, provider_id, original_visit_date FROM visits
       WHERE clinic_id = $1 ORDER BY original_visit_date DESC LIMIT 18`,
      [clinicId],
    );

    const RX_TEMPLATES: Array<Array<{ drug: string; dose: string; frequency: string; duration: string; instructions: string }>> = [
      [
        { drug: 'Doxycycline', dose: '100 mg', frequency: 'مرة يومياً', duration: '٦ أسابيع', instructions: 'مع كوب ماء كبير والبقاء في وضع مستقيم ٣٠ دقيقة' },
        { drug: 'Differin', dose: 'طبقة رقيقة', frequency: 'مرة ليلاً', duration: '٣ أشهر', instructions: 'على بشرة جافة بعد التنظيف — تجنب منطقة العين' },
        { drug: 'Skinoren', dose: 'طبقة رقيقة', frequency: 'مرتين يومياً', duration: '٣ أشهر', instructions: 'يُدهن على المناطق المصابة فقط' },
      ],
      [
        { drug: 'Zyrtec', dose: '10 mg', frequency: 'مرة ليلاً', duration: '٢ أسابيع', instructions: 'قد يسبب نعاساً — يُتناول قبل النوم' },
        { drug: 'Fucidin', dose: 'طبقة رقيقة', frequency: '٣ مرات يومياً', duration: '٧ أيام', instructions: 'موضعياً على المناطق الملتهبة' },
      ],
      [
        { drug: 'Acretin', dose: 'حجم حبة البازلاء', frequency: 'مرة ليلاً', duration: '٤ أشهر', instructions: 'ابدئي مرتين أسبوعياً ثم زيدي تدريجياً' },
        { drug: 'EMLA Cream', dose: 'طبقة سميكة', frequency: 'قبل الجلسة بـ ٣٠–٤٥ دقيقة', duration: 'حسب الحاجة', instructions: 'يُغطى بغطاء لاصق شفاف' },
      ],
      [
        { drug: 'Curacne', dose: '20 mg', frequency: 'مرة يومياً', duration: '٦ أشهر', instructions: 'مع وجبة دسمة — ممنوع الحمل تماماً خلال العلاج' },
        { drug: 'Deltacortril', dose: '5 mg', frequency: 'مرة صباحاً', duration: '١٠ أيام', instructions: 'يُنقص تدريجياً حسب تعليمات الطبيب' },
      ],
    ];

    for (const v of visitsForRx) {
      const template = pick(RX_TEMPLATES);
      const [rx] = await qr.query(
        `INSERT INTO prescriptions
           (id, clinic_id, patient_id, visit_id, provider_id, issued_at, status, notes, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $5, $5)
         RETURNING id`,
        [
          clinicId, v.patient_id, v.id, v.provider_id, v.original_visit_date,
          bool(0.7) ? 'printed' : 'issued',
          bool(0.3) ? 'أعيدي التقييم بعد أسبوعين إذا استمرت الأعراض' : null,
        ],
      );
      prescriptionN++;

      let sort = 0;
      for (const it of template) {
        const d = drugByName(it.drug);
        await qr.query(
          `INSERT INTO prescription_items
             (id, clinic_id, prescription_id, drug_id, drug_name, dose, frequency, duration, instructions, quantity, sort_order, created_at)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            clinicId, rx.id, d?.id ?? null, it.drug, it.dose, it.frequency, it.duration,
            it.instructions, int(1, 3), sort++, v.original_visit_date,
          ],
        );
        prescriptionItemN++;
      }
    }
    console.log(`   ✓ ${prescriptionN} prescriptions, ${prescriptionItemN} items`);

    // ── 6. Invoices + line items ───────────────────────────────────────────
    console.log('\n💰 Step 6: Invoices with realistic payment states');
    const [invSeqRow] = await qr.query(
      `SELECT current_value, prefix FROM tenant_sequences
       WHERE clinic_id = $1 AND sequence_type = 'INVOICE' FOR UPDATE`,
      [clinicId],
    );
    let invSeq = parseInt(invSeqRow?.current_value ?? '0', 10) || 0;
    const invPrefix: string = invSeqRow?.prefix || `INV-${new Date().getFullYear()}-`;

    let invoiceN = 0;
    let invoiceItemN = 0;

    // One invoice per completed appointment (that does not already have one).
    for (const appt of completed) {
      const [already] = await qr.query(
        `SELECT 1 AS present FROM invoices WHERE clinic_id = $1 AND patient_id = $2
           AND issue_date = $3 LIMIT 1`,
        [clinicId, appt.patient.id, isoDate(appt.start)],
      );
      if (already) continue;

      invSeq++;
      const invoiceNumber = `${invPrefix}${String(invSeq).padStart(5, '0')}`;
      const unitPrice = Number(appt.service.current_price);
      const quantity = bool(0.15) ? 2 : 1;
      const subtotal = unitPrice * quantity;
      const discount = bool(0.2) ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal - discount;

      const roll = rnd();
      let paid: number;
      let status: string;
      if (roll < 0.6) {
        paid = total;
        status = 'paid';
      } else if (roll < 0.85) {
        paid = Math.round(total / 2);
        status = 'partially_paid';
      } else if (roll < 0.93) {
        paid = 0;
        status = 'issued';
      } else {
        paid = 0;
        status = 'overdue';
      }

      const issueDate = appt.start;
      const [inv] = await qr.query(
        `INSERT INTO invoices
           (id, clinic_id, patient_id, invoice_number, currency, issue_date, due_date,
            subtotal, discount_amount, tax_amount, total, paid_amount, status, notes, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, NULL, $12, $12)
         RETURNING id`,
        [
          clinicId, appt.patient.id, invoiceNumber, clinic.currency,
          isoDate(issueDate), isoDate(new Date(issueDate.getTime() + 14 * DAY)),
          subtotal, discount, total, paid, status, issueDate,
        ],
      );
      invoiceN++;

      await qr.query(
        `INSERT INTO invoice_items
           (id, clinic_id, invoice_id, service_id, description, unit_price, quantity, line_total)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)`,
        [clinicId, inv.id, appt.service.id, appt.service.name, unitPrice, quantity, subtotal],
      );
      invoiceItemN++;

      if (bool(0.25)) {
        const addon = svc('Post-Procedure Follow-Up & Touch-Up');
        await qr.query(
          `INSERT INTO invoice_items
             (id, clinic_id, invoice_id, service_id, description, unit_price, quantity, line_total)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 1, $5)`,
          [clinicId, inv.id, addon.id, 'Post-Procedure Follow-Up & Touch-Up', Number(addon.current_price)],
        );
        invoiceItemN++;
      }
    }

    await qr.query(
      `UPDATE tenant_sequences SET current_value = $2, updated_at = now()
       WHERE clinic_id = $1 AND sequence_type = 'INVOICE'`,
      [clinicId, String(invSeq)],
    );
    console.log(`   ✓ ${invoiceN} invoices, ${invoiceItemN} line items (paid / partial / outstanding)`);

    // ── 7. Before / after records ──────────────────────────────────────────
    console.log('\n📸 Step 7: Before/after clinical photography');
    let baN = 0;
    let baImageN = 0;
    const baPatients = patients.slice(0, 12);

    for (const p of baPatients) {
      const provider = pick(providerIds);
      const treatment = pick(services);
      const recorded = new Date(Date.now() - int(5, 150) * DAY);
      const [rec] = await qr.query(
        `INSERT INTO before_after_records
           (id, clinic_id, patient_id, title, treatment_description, notes, recorded_date, created_by, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $8)
         RETURNING id`,
        [
          clinicId, p.id,
          `${treatment.name} — ${p.firstName}`,
          pick(TREATMENT_PLANS),
          'تحسن ملحوظ في الملمس والنضارة. التصوير بنفس الإضاءة والزاوية.',
          isoDate(recorded), provider,
          // `recorded_date` is DATE while created_at/updated_at are TIMESTAMPTZ;
          // sharing one parameter across both makes PostgreSQL reject the query
          // with 42P08 (inconsistent types deduced), so pass the timestamp
          // separately.
          recorded,
        ],
      );
      baN++;

      for (const type of ['before', 'after'] as const) {
        await qr.query(
          `INSERT INTO before_after_images
             (id, clinic_id, record_id, image_type, storage_key, caption, sort_order, taken_at, created_at)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $7)`,
          [
            clinicId, rec.id, type,
            `demo/patients/${p.number}/${type}-${Date.now()}-${baImageN}.jpg`,
            type === 'before' ? 'قبل الجلسة' : 'بعد الجلسة',
            type === 'before' ? 0 : 1,
            new Date(recorded.getTime() + (type === 'after' ? int(20, 60) * DAY : 0)),
          ],
        );
        baImageN++;
      }
    }
    console.log(`   ✓ ${baN} before/after records with ${baImageN} images`);

    // ── 8. Inventory movements (stock consumed by procedures) ──────────────
    console.log('\n📦 Step 8: Inventory consumption movements');
    let movementN = 0;

    if (inventory.length > 0) {
      const [hasMovements] = await qr.query(
        `SELECT 1 AS present FROM inventory_movements WHERE clinic_id = $1 LIMIT 1`,
        [clinicId],
      );
      if (!hasMovements) {
        const [batch] = await qr.query(
          `SELECT id, item_id FROM inventory_batches WHERE clinic_id = $1 ORDER BY expiry_date LIMIT 1`,
          [clinicId],
        );
        for (let i = 0; i < 40; i++) {
          const item = pick(inventory);
          const when = new Date(Date.now() - int(1, 60) * DAY);
          await qr.query(
            `INSERT INTO inventory_movements
               (id, clinic_id, item_id, batch_id, movement_type, quantity, reason, created_by, created_at)
             VALUES (uuid_generate_v4(), $1, $2, $3, 'consume', $4, $5, $6, $7)`,
            [
              clinicId, item.id, batch?.item_id === item.id ? batch.id : null,
              int(1, 4),
              pick(['استخدام في جلسة', 'صرف للعميلة', 'هالك / تلف']),
              pick(providerIds), when,
            ],
          );
          movementN++;
        }
      }
    }
    console.log(`   ✓ ${movementN} stock movements`);

    // ── 9. Patient files ───────────────────────────────────────────────────
    console.log('\n📁 Step 9: Patient documents');
    let fileN = 0;
    for (const p of patients.slice(0, 15)) {
      for (let i = 0; i < int(1, 2); i++) {
        const cat = pick(['lab_report', 'imaging', 'consent', 'other']);
        await qr.query(
          `INSERT INTO patient_files
             (id, clinic_id, patient_id, category, file_name, mime_type, size_bytes,
              storage_key, storage_bucket, description, tags, uploaded_by, is_archived, created_at)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, 'clinic-files', $8, '', $9, false, $10)`,
          [
            clinicId, p.id, cat,
            cat === 'lab_report' ? `تحاليل-${p.number}.pdf` : `مستند-${p.number}-${i + 1}.jpg`,
            cat === 'lab_report' ? 'application/pdf' : 'image/jpeg',
            int(120_000, 3_500_000),
            `demo/patients/${p.number}/${cat}-${i}.pdf`,
            'مرفق تجريبي لعرض شاشة ملفات العميلة',
            pick(providerIds),
            new Date(Date.now() - int(3, 200) * DAY),
          ],
        );
        fileN++;
      }
    }
    console.log(`   ✓ ${fileN} patient files`);

    // ── 10. Audit trail ────────────────────────────────────────────────────
    console.log('\n🔐 Step 10: Audit log trail');
    const [owner] = await qr.query(
      `SELECT id, email FROM users WHERE clinic_id = $1 ORDER BY created_at LIMIT 1`,
      [clinicId],
    );
    let auditN = 0;
    const auditActions = [
      ['patient.create', 'patient'], ['patient.update', 'patient'],
      ['appointment.create', 'appointment'], ['appointment.update', 'appointment'],
      ['invoice.create', 'invoice'], ['invoice.payment', 'invoice'],
      ['visit.finalize', 'visit'], ['prescription.create', 'prescription'],
      ['prescription.print', 'prescription'], ['user.login', 'user'],
      ['before_after.create', 'before_after_record'], ['lab.result.enter', 'lab_request'],
    ];
    for (let i = 0; i < 90; i++) {
      const [action, entity] = pick(auditActions);
      const p = pick(patients);
      await qr.query(
        `INSERT INTO audit_logs
           (id, clinic_id, user_id, user_email, action, entity_type, entity_id, changes, ip_address, user_agent, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          clinicId, owner?.id ?? null, owner?.email ?? 'demo@entrusticbeauty.app',
          action, entity, p.id,
          JSON.stringify({ demo: true, patient: p.number }),
          `41.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
          new Date(Date.now() - int(0, 45) * DAY - int(0, 86_400) * 1000),
        ],
      );
      auditN++;
    }
    console.log(`   ✓ ${auditN} audit log entries`);

    // ── 11. Marker ─────────────────────────────────────────────────────────
    await qr.query(
      `INSERT INTO audit_logs
         (id, clinic_id, user_id, user_email, action, entity_type, entity_id, changes, ip_address, created_at)
       VALUES (uuid_generate_v4(), $1, NULL, 'seed@local', $2, 'demo', NULL, $3, '127.0.0.1', now())`,
      [clinicId, DEMO_MARKER, JSON.stringify({ patients: patients.length, appointments: appointments.length, visits: visitN, invoices: invoiceN })],
    );

    await qr.commitTransaction();

    console.log('\n✅ Demo data seeded successfully!\n');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Patients:      ${patients.length} (all female, Arabic names)`);
    console.log(`  Appointments:  ${appointments.length}`);
    console.log(`  Visits:        ${visitN}`);
    console.log(`  Prescriptions: ${prescriptionN}`);
    console.log(`  Invoices:      ${invoiceN}`);
    console.log(`  Before/After:  ${baN} records`);
    console.log(`  Audit rows:    ${auditN}`);
    console.log('═══════════════════════════════════════════════\n');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\n❌ Demo seed failed — transaction rolled back:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

// Imported for type-safety only — the demo rows are inserted with raw SQL.
void 0;

seed();
