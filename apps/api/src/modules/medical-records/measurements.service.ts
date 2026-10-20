import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitMeasurement } from '../records/entities/visit-measurement.entity';
import { Visit } from '../records/entities/visit.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MeasurementTrend, RecordMeasurementDto } from '@clinic/shared-types';

interface TrendsQuery {
  days?: string | number;
  from?: string;
  to?: string;
}

@Injectable()
export class MeasurementsService {
  constructor(
    @InjectRepository(VisitMeasurement)
    private readonly repo: Repository<VisitMeasurement>,
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async findAll(clinicId: string, patientId: string) {
    return this.repo.find({
      where: { clinic_id: clinicId, patient_id: patientId },
      order: { recorded_at: 'DESC' },
    });
  }

  /**
   * Grouped time series per measurement key — the payload behind vitals trend
   * charts (staff screen + patient portal). `days` limits the window (0, absent
   * or invalid = all history); explicit from/to win over days.
   */
  async trends(
    clinicId: string,
    patientId: string,
    query: TrendsQuery = {},
  ): Promise<MeasurementTrend[]> {
    const qb = this.repo
      .createQueryBuilder('m')
      .where('m.clinic_id = :clinicId', { clinicId })
      .andWhere('m.patient_id = :patientId', { patientId });

    const from = this.parseDate(query.from);
    const to = this.parseDate(query.to);
    const days = Number(query.days);
    if (from) {
      qb.andWhere('m.recorded_at >= :from', { from });
    } else if (Number.isFinite(days) && days > 0) {
      qb.andWhere('m.recorded_at >= :since', {
        since: new Date(Date.now() - days * 86400000),
      });
    }
    if (to) {
      qb.andWhere('m.recorded_at <= :to', { to });
    }
    qb.orderBy('m.recorded_at', 'ASC').addOrderBy('m.id', 'ASC');

    const rows = await qb.getMany();
    const byKey = new Map<string, MeasurementTrend>();
    for (const row of rows) {
      const value = Number(row.value);
      if (!Number.isFinite(value)) continue;
      let trend = byKey.get(row.key);
      if (!trend) {
        trend = { key: row.key, unit: row.unit, points: [], latest: value, min: value, max: value };
        byKey.set(row.key, trend);
      }
      trend.points.push({ at: new Date(row.recorded_at).toISOString(), value });
      trend.latest = value;
      trend.min = Math.min(trend.min, value);
      trend.max = Math.max(trend.max, value);
    }
    return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * Record one reading. `visit_id` may be null (standalone readings recorded
   * outside a clinical visit); the patient and, when given, the visit must
   * belong to this clinic — foreign ids answer 404.
   */
  async create(
    clinicId: string,
    patientId: string,
    dto: RecordMeasurementDto,
    userId?: string,
  ): Promise<VisitMeasurement> {
    const raw = (dto ?? {}) as Record<string, unknown>;
    const key = String(raw.key ?? '').trim();
    if (!key || key.length > 100) {
      throw new BadRequestException('A measurement key is required (max 100 characters)');
    }
    const value = Number(raw.value);
    if (raw.value === null || raw.value === undefined || raw.value === '' || !Number.isFinite(value)) {
      throw new BadRequestException('Measurement value must be a finite number');
    }
    const unit = String(raw.unit ?? '').trim();
    if (!unit || unit.length > 30) {
      throw new BadRequestException('A measurement unit is required (max 30 characters)');
    }
    const notes =
      raw.notes !== undefined && raw.notes !== null && String(raw.notes).trim() !== ''
        ? String(raw.notes).trim().slice(0, 1000)
        : null;
    const visitId = raw.visitId ? String(raw.visitId) : null;

    const patient = await this.patientRepo.findOne({
      where: { id: patientId, clinic_id: clinicId, deleted_at: null },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (visitId) {
      const visit = await this.visitRepo.findOne({
        where: { id: visitId, clinic_id: clinicId, patient_id: patientId },
      });
      if (!visit) {
        throw new NotFoundException('Visit not found for this patient');
      }
    }

    const row = this.repo.create({
      clinic_id: clinicId,
      patient_id: patientId,
      visit_id: visitId,
      key,
      value,
      unit,
      notes,
      created_by: userId ?? null,
    });
    const saved = await this.repo.save(row);
    // node-postgres returns NUMERIC as string — normalize before it hits JSON.
    (saved as { value: unknown }).value = Number(saved.value);
    return saved;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
