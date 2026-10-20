import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import {
  ITelemedRoomState,
  ITelemedSignal,
  ISignalPage,
  PostSignalDto,
  TelemedRoomListItem,
  TelemedRoomPhase,
  TelemedSignalKind,
} from '@clinic/shared-types';

export interface TelemedViewer {
  type: 'patient' | 'provider';
  id: string;
}

const JOINABLE_STATUSES = ['scheduled', 'confirmed', 'in_progress'];
const SIGNALABLE_KINDS: TelemedSignalKind[] = [
  TelemedSignalKind.OFFER,
  TelemedSignalKind.ANSWER,
  TelemedSignalKind.ICE,
  TelemedSignalKind.CHAT,
];

interface AppointmentRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  provider_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  visit_type: string;
  room_code: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  patient_first: string;
  patient_last: string;
  patient_number: string;
  provider_first: string | null;
  provider_last: string | null;
}

@Injectable()
export class TelemedicineService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantTx: TenantTransactionManager,
  ) {}

  // ─── ROOM LOOKUP / STATE ───────────────────────────────────────────────────

  private async loadAppointment(
    clinicId: string,
    appointmentId: string,
    viewer: TelemedViewer,
  ): Promise<AppointmentRow> {
    const rows: AppointmentRow[] = await this.dataSource.query(
      `SELECT a.id, a.clinic_id, a.patient_id, a.provider_id, a.start_time, a.end_time,
              a.status, a.visit_type, a.room_code, a.notes, a.cancellation_reason,
              p.first_name AS patient_first, p.last_name AS patient_last, p.patient_number,
              u.first_name AS provider_first, u.last_name AS provider_last
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN users u ON u.id = a.provider_id
       WHERE a.clinic_id = $1 AND a.id = $2`,
      [clinicId, appointmentId],
    );
    const appt = rows[0];
    // Patients only ever see their own appointments — unknown vs foreign both 404.
    if (!appt || (viewer.type === 'patient' && appt.patient_id !== viewer.id)) {
      throw new NotFoundException('Appointment not found');
    }
    if (appt.visit_type !== 'telemedicine') {
      throw new BadRequestException('This appointment is not a telemedicine visit');
    }
    return appt;
  }

  private assertJoinable(appt: AppointmentRow): void {
    if (!JOINABLE_STATUSES.includes(appt.status)) {
      throw new BadRequestException(
        `This visit is ${appt.status} — the room is closed`,
      );
    }
  }

  private async presence(
    clinicId: string,
    appointmentId: string,
  ): Promise<{ patientPresent: boolean; providerPresent: boolean }> {
    const rows: Array<{ sender: string; kind: string }> = await this.dataSource.query(
      `SELECT DISTINCT ON (sender) sender, kind
       FROM telemedicine_signals
       WHERE clinic_id = $1 AND appointment_id = $2 AND kind IN ('join','leave')
       ORDER BY sender, seq DESC`,
      [clinicId, appointmentId],
    );
    const last: Record<string, string> = {};
    for (const r of rows) last[r.sender] = r.kind;
    return {
      patientPresent: last['patient'] === 'join',
      providerPresent: last['provider'] === 'join',
    };
  }

  private phaseOf(patientPresent: boolean, providerPresent: boolean): TelemedRoomPhase {
    if (patientPresent && providerPresent) return 'connected';
    if (patientPresent) return 'waiting';
    if (providerPresent) return 'provider_waiting';
    return 'not_started';
  }

  async getRoomState(
    clinicId: string,
    appointmentId: string,
    viewer: TelemedViewer,
  ): Promise<ITelemedRoomState> {
    const appt = await this.loadAppointment(clinicId, appointmentId, viewer);
    const pres = await this.presence(clinicId, appointmentId);
    return {
      appointmentId: appt.id,
      roomCode: appt.room_code,
      visitType: appt.visit_type as ITelemedRoomState['visitType'],
      appointmentStatus: appt.status,
      startTime: new Date(appt.start_time).toISOString(),
      endTime: new Date(appt.end_time).toISOString(),
      patientId: appt.patient_id,
      patientName: `${appt.patient_first} ${appt.patient_last}`,
      providerName:
        appt.provider_first != null
          ? `${appt.provider_first} ${appt.provider_last ?? ''}`.trim()
          : 'Clinic staff',
      notes: appt.notes,
      patientPresent: pres.patientPresent,
      providerPresent: pres.providerPresent,
      phase: this.phaseOf(pres.patientPresent, pres.providerPresent),
    };
  }

  async listRooms(clinicId: string, date?: string): Promise<TelemedRoomListItem[]> {
    let dayStart: Date;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dayStart = new Date(`${date}T00:00:00`);
    } else {
      const now = new Date();
      dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Invalid date — expected YYYY-MM-DD');
    }
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

    const rows: any[] = await this.dataSource.query(
      `SELECT a.id, a.room_code, a.start_time, a.end_time, a.status,
              a.patient_id,
              p.first_name AS patient_first, p.last_name AS patient_last, p.phone AS patient_phone,
              u.first_name AS provider_first, u.last_name AS provider_last
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN users u ON u.id = a.provider_id
       WHERE a.clinic_id = $1 AND a.visit_type = 'telemedicine'
         AND a.start_time >= $2 AND a.start_time < $3
       ORDER BY a.start_time ASC`,
      [clinicId, dayStart.toISOString(), dayEnd.toISOString()],
    );

    const items: TelemedRoomListItem[] = [];
    for (const r of rows) {
      const pres = await this.presence(clinicId, r.id);
      items.push({
        appointmentId: r.id,
        roomCode: r.room_code,
        startTime: new Date(r.start_time).toISOString(),
        endTime: new Date(r.end_time).toISOString(),
        status: r.status,
        patientId: r.patient_id,
        patientName: `${r.patient_first} ${r.patient_last}`,
        patientPhone: r.patient_phone ?? null,
        providerName:
          r.provider_first != null
            ? `${r.provider_first} ${r.provider_last ?? ''}`.trim()
            : 'Clinic staff',
        patientPresent: pres.patientPresent,
        providerPresent: pres.providerPresent,
        phase: this.phaseOf(pres.patientPresent, pres.providerPresent),
      });
    }
    return items;
  }

  // ─── JOIN / LEAVE (presence) ───────────────────────────────────────────────

  async join(
    clinicId: string,
    appointmentId: string,
    viewer: TelemedViewer,
  ): Promise<ITelemedRoomState> {
    const appt = await this.loadAppointment(clinicId, appointmentId, viewer);
    this.assertJoinable(appt);

    const pres = await this.presence(clinicId, appointmentId);
    const me = viewer.type;
    const amPresent = me === 'patient' ? pres.patientPresent : pres.providerPresent;
    if (!amPresent) {
      await this.tenantTx.runWithTenant((qr) =>
        qr.query(
          `INSERT INTO telemedicine_signals (id, clinic_id, appointment_id, sender, kind, payload)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'join', NULL)`,
          [clinicId, appointmentId, me],
        ),
      );
    }
    return this.getRoomState(clinicId, appointmentId, viewer);
  }

  async leave(
    clinicId: string,
    appointmentId: string,
    viewer: TelemedViewer,
  ): Promise<ITelemedRoomState> {
    await this.loadAppointment(clinicId, appointmentId, viewer);
    const pres = await this.presence(clinicId, appointmentId);
    const me = viewer.type;
    const amPresent = me === 'patient' ? pres.patientPresent : pres.providerPresent;
    if (amPresent) {
      await this.tenantTx.runWithTenant((qr) =>
        qr.query(
          `INSERT INTO telemedicine_signals (id, clinic_id, appointment_id, sender, kind, payload)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'leave', NULL)`,
          [clinicId, appointmentId, me],
        ),
      );
    }
    return this.getRoomState(clinicId, appointmentId, viewer);
  }

  // ─── SIGNALS (offer / answer / ice / chat) ─────────────────────────────────

  async postSignal(
    clinicId: string,
    appointmentId: string,
    viewer: TelemedViewer,
    dto: PostSignalDto,
  ): Promise<ITelemedSignal> {
    const appt = await this.loadAppointment(clinicId, appointmentId, viewer);
    this.assertJoinable(appt);

    const kind = dto.kind as TelemedSignalKind;
    if (!SIGNALABLE_KINDS.includes(kind)) {
      throw new BadRequestException('Unsupported signal kind');
    }

    // Validate on the trimmed form, but store signaling payloads VERBATIM —
    // trailing whitespace is significant for SDP (offer/answer/ice end with
    // CRLF, and Chrome rejects an unterminated final line).
    const raw = dto.payload ?? '';
    if (!raw.trim()) {
      throw new BadRequestException('Signal payload is required');
    }
    if (kind === TelemedSignalKind.CHAT) {
      if (raw.trim().length > 2000) {
        throw new BadRequestException('Message too long (2000 characters max)');
      }
    } else if (raw.length > 100000) {
      throw new BadRequestException('Signal payload too large');
    }
    const payload = kind === TelemedSignalKind.CHAT ? raw.trim() : raw;

    const rows = await this.tenantTx.runWithTenant((qr) =>
      qr.query(
        `INSERT INTO telemedicine_signals (id, clinic_id, appointment_id, sender, kind, payload)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
         RETURNING id, appointment_id, sender, kind, payload, seq, created_at`,
        [clinicId, appointmentId, viewer.type, kind, payload],
      ),
    );
    return this.mapSignal(rows[0]);
  }

  async listSignals(
    clinicId: string,
    appointmentId: string,
    viewer: TelemedViewer,
    after: number,
  ): Promise<ISignalPage> {
    // Validates existence + patient access (throws 404/400 as appropriate).
    await this.loadAppointment(clinicId, appointmentId, viewer);
    const cursor = Number.isFinite(after) && after > 0 ? Math.floor(after) : 0;

    const rows: any[] = await this.dataSource.query(
      `SELECT id, appointment_id, sender, kind, payload, seq, created_at
       FROM telemedicine_signals
       WHERE clinic_id = $1 AND appointment_id = $2 AND seq > $3
       ORDER BY seq ASC
       LIMIT 500`,
      [clinicId, appointmentId, cursor],
    );

    const signals = rows.map((r) => this.mapSignal(r));
    const latestSeq = signals.length
      ? signals[signals.length - 1].seq
      : cursor;
    return { signals, latestSeq };
  }

  private mapSignal(r: any): ITelemedSignal {
    return {
      id: r.id,
      appointmentId: r.appointment_id,
      sender: r.sender,
      kind: r.kind,
      payload: r.payload ?? null,
      seq: Number(r.seq),
      createdAt: new Date(r.created_at).toISOString(),
    };
  }
}
