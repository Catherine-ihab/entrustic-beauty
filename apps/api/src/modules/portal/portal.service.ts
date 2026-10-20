import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import {
  TENANT_ID_KEY,
  TENANT_SLUG_KEY,
} from '../../common/middleware/tenant-resolution.middleware';
import { resolveProvider } from '../notifications/messaging.provider';
import { AppointmentsService } from '../appointments/appointments.service';
import {
  BookAppointmentDto,
  IJwtPayload,
  IPortalMe,
  IPortalPatientSummary,
  IPortalSession,
  PortalAppointment,
  PortalCodeResponse,
  PortalInvoice,
  PortalLabResult,
  PortalPrescription,
  PortalProviderOption,
  PortalServiceOption,
  RequestPortalCodeDto,
  VerifyPortalCodeDto,
  VisitType,
} from '@clinic/shared-types';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_TTL_SQL = `${OTP_TTL_MINUTES} minutes`;
const PORTAL_TOKEN_TTL = '7d';
const PORTAL_TOKEN_TTL_SECONDS = 7 * 24 * 3600;

/** DATE columns arrive as local-midnight Date objects (or raw strings) — avoid UTC shifts. */
const formatDate = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

@Injectable()
export class PortalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantTx: TenantTransactionManager,
    private readonly cls: ClsService,
    private readonly jwtService: JwtService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  // ─── AUTH: one-time codes ──────────────────────────────────────────────────

  private async resolveClinic(clinicSlug?: string): Promise<{ id: string; name: string }> {
    const slug = (clinicSlug?.trim() || this.cls.get<string>(TENANT_SLUG_KEY) || '')
      .toLowerCase();
    if (!slug) {
      throw new BadRequestException('Clinic is required — provide clinicSlug');
    }
    const rows: any[] = await this.dataSource.query(
      `SELECT id, name FROM clinics WHERE slug = $1 AND status = 'active' LIMIT 1`,
      [slug],
    );
    if (!rows[0]) {
      throw new BadRequestException('Clinic not found or inactive');
    }
    // Bind the RLS tenant for this (guard-less) request.
    this.cls.set(TENANT_ID_KEY, rows[0].id);
    return rows[0];
  }

  private normalizeIdentifier(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed.toLowerCase();
    // Egyptian local format 01XXXXXXXXX → +201XXXXXXXXX
    const digits = trimmed.replace(/[\s-]/g, '');
    if (/^0\d{9,10}$/.test(digits)) return `+20${digits.slice(1)}`;
    return digits;
  }

  private async findPatient(clinicId: string, identifier: string): Promise<any> {
    const rows: any[] = await this.dataSource.query(
      `SELECT id, patient_number, first_name, last_name, phone, email, gender,
              date_of_birth, blood_type, allergies, address,
              emergency_contact_name, emergency_contact_phone
       FROM patients
       WHERE clinic_id = $1 AND deleted_at IS NULL
         AND (REPLACE(REPLACE(COALESCE(phone, ''), ' ', ''), '-', '') = $2
              OR LOWER(COALESCE(email, '')) = LOWER($2))
       LIMIT 1`,
      [clinicId, identifier],
    );
    return rows[0] ?? null;
  }

  async requestCode(dto: RequestPortalCodeDto): Promise<PortalCodeResponse> {
    const clinic = await this.resolveClinic(dto.clinicSlug);
    const identifier = this.normalizeIdentifier(dto.identifier ?? '');
    if (!identifier) {
      throw new BadRequestException('Phone or email is required');
    }

    const channel = dto.channel === 'whatsapp' ? 'whatsapp' : 'sms';
    const patient = await this.findPatient(clinic.id, identifier);
    if (!patient) {
      throw new BadRequestException('No patient found with this phone or email');
    }
    if (!patient.phone) {
      throw new BadRequestException(
        'This patient has no phone number on file — ask the clinic to add one',
      );
    }

    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const codeHash = await argon2.hash(code);
    const recipient: string = patient.phone;

    // Persist first (single active code per patient), then deliver.
    await this.tenantTx.runWithTenant(async (qr) => {
      await qr.query(
        `DELETE FROM patient_otps WHERE clinic_id = $1 AND patient_id = $2 AND consumed_at IS NULL`,
        [clinic.id, patient.id],
      );
      await qr.query(
        `INSERT INTO patient_otps (id, clinic_id, patient_id, channel, recipient, code_hash, expires_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, now() + interval '${OTP_TTL_SQL}')`,
        [clinic.id, patient.id, channel, recipient, codeHash],
      );
    });

    const provider = resolveProvider(channel);
    try {
      await provider.send({
        to: recipient,
        channel,
        body: `Your ${clinic.name} portal login code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      });
    } catch {
      throw new BadRequestException('Could not send the code right now — try again');
    }

    const masked =
      recipient.length > 7
        ? `${recipient.slice(0, 4)}••••${recipient.slice(-3)}`
        : recipient;

    return {
      sent: true,
      channel,
      recipient: masked,
      expiresInMinutes: OTP_TTL_MINUTES,
      // The console driver is the demo driver — expose the code outside
      // production so local demos/E2E can verify without real SMS delivery.
      // In production this must never leak: real providers (Twilio/Meta) are used.
      ...(provider.name === 'console' && process.env.NODE_ENV !== 'production'
        ? { devCode: code }
        : {}),
    };
  }

  async verify(dto: VerifyPortalCodeDto): Promise<IPortalSession> {
    const clinic = await this.resolveClinic(dto.clinicSlug);
    const identifier = this.normalizeIdentifier(dto.identifier ?? '');
    const code = (dto.code ?? '').trim();
    if (!identifier || !code) {
      throw new BadRequestException('Phone/email and code are required');
    }

    const patient = await this.findPatient(clinic.id, identifier);
    if (!patient) {
      throw new BadRequestException('No patient found with this phone or email');
    }

    const [otp] = await this.dataSource.query(
      `SELECT * FROM patient_otps
       WHERE clinic_id = $1 AND patient_id = $2 AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [clinic.id, patient.id],
    );
    if (!otp) {
      throw new BadRequestException('No active code — request a new one');
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('That code has expired — request a new one');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts — request a new code');
    }

    let valid = false;
    try {
      valid = await argon2.verify(otp.code_hash, code);
    } catch {
      valid = false;
    }
    if (!valid) {
      await this.tenantTx.runWithTenant((qr) =>
        qr.query(`UPDATE patient_otps SET attempts = attempts + 1 WHERE id = $1`, [otp.id]),
      );
      throw new BadRequestException('Invalid code');
    }

    await this.tenantTx.runWithTenant((qr) =>
      qr.query(`UPDATE patient_otps SET consumed_at = now() WHERE id = $1`, [otp.id]),
    );

    const payload: IJwtPayload = {
      sub: patient.id,
      email: patient.email ?? '',
      clinic_id: clinic.id,
      is_platform_admin: false,
      roles: ['patient'],
      permissions: [],
      type: 'patient',
      patient_id: patient.id,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: PORTAL_TOKEN_TTL });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: PORTAL_TOKEN_TTL_SECONDS,
      patient: this.mapSummary(patient),
    };
  }

  private mapSummary(p: any): IPortalPatientSummary {
    return {
      id: p.id,
      patientNumber: p.patient_number,
      firstName: p.first_name,
      lastName: p.last_name,
      fullName: `${p.first_name} ${p.last_name}`,
      phone: p.phone ?? null,
      email: p.email ?? null,
      gender: p.gender,
      dateOfBirth: formatDate(p.date_of_birth),
      bloodType: p.blood_type ?? null,
      allergies: p.allergies ?? null,
    };
  }

  // ─── PROFILE / DIRECTORY ───────────────────────────────────────────────────

  async getMe(clinicId: string, patientId: string): Promise<IPortalMe> {
    const [patient] = await this.dataSource.query(
      `SELECT id, patient_number, first_name, last_name, phone, email, gender,
              date_of_birth, blood_type, allergies, address,
              emergency_contact_name, emergency_contact_phone
       FROM patients
       WHERE clinic_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [clinicId, patientId],
    );
    if (!patient) {
      throw new ForbiddenException('Patient profile unavailable');
    }
    const activeAllergies = await this.dataSource.query(
      `SELECT allergen, severity, reaction
       FROM patient_allergies
       WHERE clinic_id = $1 AND patient_id = $2 AND status = 'active'
       ORDER BY severity DESC, allergen ASC`,
      [clinicId, patientId],
    );
    return {
      ...this.mapSummary(patient),
      address: patient.address ?? null,
      emergencyContactName: patient.emergency_contact_name ?? null,
      emergencyContactPhone: patient.emergency_contact_phone ?? null,
      activeAllergies,
    };
  }

  async listProviders(clinicId: string): Promise<PortalProviderOption[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT id, first_name, last_name
       FROM users
       WHERE clinic_id = $1 AND status = 'active' AND is_platform_admin = false
       ORDER BY first_name, last_name`,
      [clinicId],
    );
    return rows.map((r) => ({
      id: r.id,
      fullName: `${r.first_name} ${r.last_name}`,
    }));
  }

  async listServices(clinicId: string): Promise<PortalServiceOption[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT id, name, default_duration_minutes, current_price, currency
       FROM clinic_services
       WHERE clinic_id = $1 AND is_active = true
       ORDER BY sort_order, name`,
      [clinicId],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      defaultDurationMinutes: r.default_duration_minutes,
      currentPrice: Number(r.current_price),
      currency: r.currency,
    }));
  }

  // ─── APPOINTMENTS ──────────────────────────────────────────────────────────

  async listAppointments(
    clinicId: string,
    patientId: string,
    scope: string,
  ): Promise<PortalAppointment[]> {
    const past = scope === 'past';
    const timeFilter = past
      ? `(a.start_time < now() OR a.status IN ('cancelled', 'no_show', 'completed'))`
      : `(a.start_time >= now() - interval '30 minutes' AND a.status NOT IN ('cancelled', 'no_show', 'completed'))`;
    const rows: any[] = await this.dataSource.query(
      `SELECT a.id, a.start_time, a.end_time, a.status, a.visit_type, a.room_code,
              a.notes, a.cancellation_reason,
              COALESCE(u.first_name || ' ' || u.last_name, 'Clinic staff') AS provider_name,
              s.name AS service_name
       FROM appointments a
       LEFT JOIN users u ON u.id = a.provider_id
       LEFT JOIN clinic_services s ON s.id = a.service_id
       WHERE a.clinic_id = $1 AND a.patient_id = $2
         AND ${timeFilter}
       ORDER BY a.start_time ${past ? 'DESC' : 'ASC'}
       LIMIT 50`,
      [clinicId, patientId],
    );
    return rows.map((r) => this.mapAppointment(r));
  }

  private mapAppointment(r: any): PortalAppointment {
    return {
      id: r.id,
      startTime: new Date(r.start_time).toISOString(),
      endTime: new Date(r.end_time).toISOString(),
      status: r.status,
      visitType: r.visit_type,
      roomCode: r.room_code ?? null,
      providerName: r.provider_name,
      serviceName: r.service_name ?? null,
      notes: r.notes ?? null,
      cancellationReason: r.cancellation_reason ?? null,
    };
  }

  async book(
    clinicId: string,
    patientId: string,
    dto: BookAppointmentDto,
  ): Promise<PortalAppointment> {
    if (!dto?.providerId) throw new BadRequestException('providerId is required');
    if (!dto?.startTime) throw new BadRequestException('startTime is required');

    const start = new Date(dto.startTime);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('Invalid startTime');
    if (start.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }

    let end: Date;
    if (dto.endTime) {
      end = new Date(dto.endTime);
      if (Number.isNaN(end.getTime())) throw new BadRequestException('Invalid endTime');
    } else {
      let minutes = 30;
      if (dto.serviceId) {
        const [svc] = await this.dataSource.query(
          `SELECT default_duration_minutes FROM clinic_services
           WHERE id = $1 AND clinic_id = $2 AND is_active = true`,
          [dto.serviceId, clinicId],
        );
        if (svc) minutes = Number(svc.default_duration_minutes);
      }
      end = new Date(start.getTime() + minutes * 60_000);
    }

    const [provider] = await this.dataSource.query(
      `SELECT id FROM users WHERE id = $1 AND clinic_id = $2 AND status = 'active'`,
      [dto.providerId, clinicId],
    );
    if (!provider) {
      throw new BadRequestException('Provider not found');
    }

    // Conflict detection + snake_case mapping live in AppointmentsService.
    const created = await this.appointmentsService.create(clinicId, null, {
      patientId,
      providerId: dto.providerId,
      serviceId: dto.serviceId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      notes: dto.notes,
      visitType: dto.visitType ?? VisitType.IN_PERSON,
    });

    const [row] = await this.dataSource.query(
      `SELECT a.id, a.start_time, a.end_time, a.status, a.visit_type, a.room_code,
              a.notes, a.cancellation_reason,
              COALESCE(u.first_name || ' ' || u.last_name, 'Clinic staff') AS provider_name,
              s.name AS service_name
       FROM appointments a
       LEFT JOIN users u ON u.id = a.provider_id
       LEFT JOIN clinic_services s ON s.id = a.service_id
       WHERE a.id = $1`,
      [created.id],
    );
    return this.mapAppointment(row);
  }

  // ─── RECORDS (read-only) ───────────────────────────────────────────────────

  async listPrescriptions(clinicId: string, patientId: string): Promise<PortalPrescription[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT pr.id, pr.issued_at, pr.status, pr.notes,
              COALESCE(
                json_agg(
                  json_build_object(
                    'drugName', pi.drug_name,
                    'dose', pi.dose,
                    'frequency', pi.frequency,
                    'duration', pi.duration,
                    'instructions', pi.instructions,
                    'quantity', pi.quantity
                  ) ORDER BY pi.sort_order, pi.drug_name
                ) FILTER (WHERE pi.id IS NOT NULL),
                '[]'
              ) AS items
       FROM prescriptions pr
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.clinic_id = $1 AND pr.patient_id = $2
       GROUP BY pr.id
       ORDER BY pr.issued_at DESC
       LIMIT 50`,
      [clinicId, patientId],
    );
    return rows.map((r) => ({
      id: r.id,
      issuedAt: new Date(r.issued_at).toISOString(),
      status: r.status,
      notes: r.notes ?? null,
      items: r.items ?? [],
    }));
  }

  async listLabResults(clinicId: string, patientId: string): Promise<PortalLabResult[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT lr.id, lr.request_number, lr.status, lr.priority, lr.created_at, lr.completed_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'testName', lt.name,
                    'value', li.result_value,
                    'unit', li.result_unit,
                    'flag', li.result_flag,
                    'status', li.status
                  ) ORDER BY lt.name
                ) FILTER (WHERE li.id IS NOT NULL),
                '[]'
              ) AS items
       FROM lab_requests lr
       LEFT JOIN lab_request_items li ON li.request_id = lr.id
       LEFT JOIN lab_tests lt ON lt.id = li.test_id
       WHERE lr.clinic_id = $1 AND lr.patient_id = $2
       GROUP BY lr.id
       ORDER BY lr.created_at DESC
       LIMIT 50`,
      [clinicId, patientId],
    );
    return rows.map((r) => ({
      id: r.id,
      requestNumber: r.request_number,
      status: r.status,
      priority: r.priority,
      createdAt: new Date(r.created_at).toISOString(),
      completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      items: r.items ?? [],
    }));
  }

  async listInvoices(clinicId: string, patientId: string): Promise<PortalInvoice[]> {
    const rows: any[] = await this.dataSource.query(
      `SELECT i.id, i.invoice_number, i.issue_date, i.due_date, i.currency,
              i.subtotal, i.discount_amount, i.tax_amount, i.total, i.paid_amount, i.status,
              COALESCE(
                json_agg(
                  json_build_object(
                    'description', it.description,
                    'unitPrice', it.unit_price,
                    'quantity', it.quantity,
                    'lineTotal', it.line_total
                  ) ORDER BY it.description
                ) FILTER (WHERE it.id IS NOT NULL),
                '[]'
              ) AS items
       FROM invoices i
       LEFT JOIN invoice_items it ON it.invoice_id = i.id
       WHERE i.clinic_id = $1 AND i.patient_id = $2
       GROUP BY i.id
       ORDER BY i.issue_date DESC
       LIMIT 50`,
      [clinicId, patientId],
    );
    return rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      issueDate: formatDate(r.issue_date),
      dueDate: formatDate(r.due_date),
      currency: r.currency,
      subtotal: Number(r.subtotal),
      discountAmount: Number(r.discount_amount),
      taxAmount: Number(r.tax_amount),
      total: Number(r.total),
      paidAmount: Number(r.paid_amount),
      status: r.status,
      items: r.items ?? [],
    }));
  }
}
