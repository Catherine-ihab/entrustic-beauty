import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DashboardSummary {
  /** Live counts for the header KPI cards. */
  patients: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  appointments: {
    today: number;
    todayCompleted: number;
    todayRemaining: number;
    inProgress: number;
    waiting: number;
    upcoming: number;
  };
  revenue: {
    todayCollected: number;
    todayBilled: number;
    todayPending: number;
    monthCollected: number;
    currency: string;
  };
  capacity: {
    bookedToday: number;
    dailySlots: number;
    utilizationPercent: number;
  };
  /** Rows for the "Today's Schedule & Queue" table. */
  todaySchedule: Array<{
    id: string;
    startTime: string;
    patientName: string;
    patientNumber: string;
    service: string | null;
    provider: string;
    status: string;
  }>;
  /** Workstation / consumable status widget. */
  devices: Array<{
    id: string;
    name: string;
    model: string | null;
    status: string;
    nextCalibration: string | null;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    unit: string | null;
    remaining: number;
    reorderLevel: number;
  }>;
}

/**
 * Read-only aggregates for the landing dashboard.
 *
 * Aggregation lives on the server on purpose: the list endpoints either return
 * plain arrays without totals (`/appointments`, `/invoices`) or cap `limit` at
 * 100 (`/patients`), so computing these numbers in the browser would mean
 * fetching most of the clinic's history on every page load — and the numbers
 * would silently go wrong once the clinic passes that cap.
 */
@Injectable()
export class DashboardService {
  /** Slots the clinic is assumed to offer per day, for the capacity widget. */
  private static readonly DAILY_SLOTS = 24;

  constructor(private readonly dataSource: DataSource) {}

  async getSummary(clinicId: string): Promise<DashboardSummary> {
    const [counts, schedule, devices, lowStock, currency] = await Promise.all([
      this.counts(clinicId),
      this.todaySchedule(clinicId),
      this.devices(clinicId),
      this.lowStock(clinicId),
      this.currency(clinicId),
    ]);

    const bookedToday = counts.appointments.today;
    const utilizationPercent = Math.min(
      100,
      Math.round((bookedToday / DashboardService.DAILY_SLOTS) * 100),
    );

    return {
      ...counts,
      capacity: {
        bookedToday,
        dailySlots: DashboardService.DAILY_SLOTS,
        utilizationPercent,
      },
      todaySchedule: schedule,
      devices,
      lowStock,
      revenue: { ...counts.revenue, currency },
    };
  }

  private async counts(clinicId: string) {
    // One round-trip for every scalar: sub-selects keep it a single statement
    // so the numbers are mutually consistent.
    const [row] = await this.dataSource.query(
      `
      SELECT
        (SELECT COUNT(*) FROM patients
          WHERE clinic_id = $1 AND deleted_at IS NULL)::int AS patients_total,
        (SELECT COUNT(*) FROM patients
          WHERE clinic_id = $1 AND deleted_at IS NULL AND status = 'active')::int AS patients_active,
        (SELECT COUNT(*) FROM patients
          WHERE clinic_id = $1 AND deleted_at IS NULL
            AND created_at >= date_trunc('month', now()))::int AS patients_new_this_month,

        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE)::int AS appt_today,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE
            AND status = 'completed')::int AS appt_today_completed,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE
            AND status IN ('scheduled','confirmed'))::int AS appt_today_remaining,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND status = 'in_progress')::int AS appt_in_progress,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time::date = CURRENT_DATE
            AND status IN ('scheduled','confirmed'))::int AS appt_waiting,
        (SELECT COUNT(*) FROM appointments
          WHERE clinic_id = $1 AND start_time > now()
            AND status IN ('scheduled','confirmed'))::int AS appt_upcoming,

        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices
          WHERE clinic_id = $1 AND issue_date = CURRENT_DATE)::numeric(12,2) AS rev_today_collected,
        (SELECT COALESCE(SUM(total), 0) FROM invoices
          WHERE clinic_id = $1 AND issue_date = CURRENT_DATE)::numeric(12,2) AS rev_today_billed,
        (SELECT COALESCE(SUM(total - paid_amount), 0) FROM invoices
          WHERE clinic_id = $1 AND status IN ('issued','partially_paid','overdue'))::numeric(12,2) AS rev_today_pending,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices
          WHERE clinic_id = $1
            AND issue_date >= date_trunc('month', now()))::numeric(12,2) AS rev_month_collected
      `,
      [clinicId],
    );

    return {
      patients: {
        total: row.patients_total,
        active: row.patients_active,
        newThisMonth: row.patients_new_this_month,
      },
      appointments: {
        today: row.appt_today,
        todayCompleted: row.appt_today_completed,
        todayRemaining: row.appt_today_remaining,
        inProgress: row.appt_in_progress,
        waiting: row.appt_waiting,
        upcoming: row.appt_upcoming,
      },
      revenue: {
        todayCollected: Number(row.rev_today_collected),
        todayBilled: Number(row.rev_today_billed),
        todayPending: Number(row.rev_today_pending),
        monthCollected: Number(row.rev_month_collected),
        currency: 'EGP',
      },
    };
  }

  private async todaySchedule(clinicId: string) {
    const rows = await this.dataSource.query(
      `
      SELECT
        a.id,
        a.start_time,
        a.status,
        p.first_name || ' ' || p.last_name AS patient_name,
        p.patient_number,
        s.name AS service_name,
        u.first_name || ' ' || u.last_name AS provider_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN clinic_services s ON s.id = a.service_id
      LEFT JOIN users u ON u.id = a.provider_id
      WHERE a.clinic_id = $1 AND a.start_time::date = CURRENT_DATE
      ORDER BY a.start_time
      `,
      [clinicId],
    );

    return rows.map((r: any) => ({
      id: r.id,
      startTime: normalizeTime(r.start_time),
      patientName: r.patient_name,
      patientNumber: r.patient_number,
      service: r.service_name,
      provider: r.provider_name || '—',
      status: r.status,
    }));
  }

  private async devices(clinicId: string) {
    const rows = await this.dataSource
      .query(
        `
        SELECT id, name, model, status, next_calibration
        FROM devices
        WHERE clinic_id = $1
        ORDER BY name
        LIMIT 8
        `,
        [clinicId],
      )
      .catch(() => []);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      model: r.model,
      status: r.status,
      nextCalibration: r.next_calibration ? String(r.next_calibration).slice(0, 10) : null,
    }));
  }

  private async lowStock(clinicId: string) {
    const rows = await this.dataSource
      .query(
        `
        SELECT i.id, i.name, i.unit, i.reorder_level,
               COALESCE(SUM(b.quantity_remaining), 0)::int AS remaining
        FROM inventory_items i
        LEFT JOIN inventory_batches b ON b.item_id = i.id
        WHERE i.clinic_id = $1 AND i.is_active = true
        GROUP BY i.id, i.name, i.unit, i.reorder_level
        HAVING COALESCE(SUM(b.quantity_remaining), 0) <= i.reorder_level
        ORDER BY remaining ASC
        LIMIT 6
        `,
        [clinicId],
      )
      .catch(() => []);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      unit: r.unit,
      remaining: r.remaining,
      reorderLevel: r.reorder_level,
    }));
  }

  private async currency(clinicId: string): Promise<string> {
    const rows = await this.dataSource
      .query(`SELECT currency FROM clinics WHERE id = $1`, [clinicId])
      .catch(() => []);
    return rows[0]?.currency || 'EGP';
  }
}

/** `09:30:00` → `09:30` (pg returns TIME columns as strings). */
function normalizeTime(value: unknown): string {
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
  return String(value ?? '').slice(0, 5);
}
