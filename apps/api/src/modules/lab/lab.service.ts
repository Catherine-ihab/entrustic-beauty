import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { SequenceType } from '@clinic/shared-types';
import { LabTest } from './entities/lab-test.entity';
import { LabRequest } from './entities/lab-request.entity';
import { LabRequestItem } from './entities/lab-request-item.entity';
import {
  ILabTest,
  ILabRequest,
  ILabRequestSummary,
  ILabRequestItem,
  CreateLabTestDto,
  UpdateLabTestDto,
  CreateLabRequestDto,
  UpdateLabRequestDto,
  UpdateLabRequestItemDto,
  LabRequestStatus,
} from '@clinic/shared-types';

const REQUEST_TRANSITIONS: Record<string, LabRequestStatus[]> = {
  ordered: ['collected', 'cancelled'],
  collected: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const LAB_STATUSES: LabRequestStatus[] = [
  'ordered',
  'collected',
  'in_progress',
  'completed',
  'cancelled',
];

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabTest)
    private readonly testRepo: Repository<LabTest>,
    @InjectRepository(LabRequest)
    private readonly requestRepo: Repository<LabRequest>,
    @InjectRepository(LabRequestItem)
    private readonly itemRepo: Repository<LabRequestItem>,
    private readonly dataSource: DataSource,
    private readonly tenantTx: TenantTransactionManager,
  ) {}

  // ─── TEST CATALOG ──────────────────────────────────────────────────────────

  async listTests(clinicId: string, q?: string): Promise<ILabTest[]> {
    let sql = `SELECT id, name, category, sample_type, sample_tube, unit, reference_range,
                      turnaround_hours, is_active
               FROM lab_tests WHERE clinic_id = $1`;
    const params: Array<string | number> = [clinicId];
    if (q && q.trim()) {
      sql += ` AND (name ILIKE $${params.length + 1} OR COALESCE(category,'') ILIKE $${params.length + 1})`;
      params.push(`%${q.trim()}%`);
    }
    sql += ` ORDER BY name ASC`;
    const rows: any[] = await this.dataSource.query(sql, params);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category ?? undefined,
      sampleType: r.sample_type ?? undefined,
      sampleTube: r.sample_tube ?? undefined,
      unit: r.unit ?? undefined,
      referenceRange: r.reference_range ?? undefined,
      turnaroundHours: r.turnaround_hours ?? undefined,
      isActive: r.is_active,
    }));
  }

  async createTest(clinicId: string, dto: CreateLabTestDto): Promise<ILabTest> {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Test name is required');
    }
    const test = this.testRepo.create({
      clinic_id: clinicId,
      name: dto.name.trim(),
      category: dto.category?.trim() || null,
      sample_type: dto.sampleType?.trim() || null,
      sample_tube: dto.sampleTube?.trim() || null,
      unit: dto.unit?.trim() || null,
      reference_range: dto.referenceRange?.trim() || null,
      turnaround_hours: dto.turnaroundHours ?? null,
      is_active: true,
    });
    const saved = await this.testRepo.save(test);
    return {
      id: saved.id,
      name: saved.name,
      category: saved.category ?? undefined,
      sampleType: saved.sample_type ?? undefined,
      sampleTube: saved.sample_tube ?? undefined,
      unit: saved.unit ?? undefined,
      referenceRange: saved.reference_range ?? undefined,
      turnaroundHours: saved.turnaround_hours ?? undefined,
      isActive: saved.is_active,
    };
  }

  async updateTest(clinicId: string, id: string, dto: UpdateLabTestDto): Promise<ILabTest> {
    const test = await this.testRepo.findOne({ where: { id, clinic_id: clinicId } });
    if (!test) {
      throw new NotFoundException('Lab test not found');
    }
    if (dto.name !== undefined) test.name = dto.name.trim();
    if (dto.category !== undefined) test.category = dto.category?.trim() || null;
    if (dto.sampleType !== undefined) test.sample_type = dto.sampleType?.trim() || null;
    if (dto.sampleTube !== undefined) test.sample_tube = dto.sampleTube?.trim() || null;
    if (dto.unit !== undefined) test.unit = dto.unit?.trim() || null;
    if (dto.referenceRange !== undefined) test.reference_range = dto.referenceRange?.trim() || null;
    if (dto.turnaroundHours !== undefined) test.turnaround_hours = dto.turnaroundHours ?? null;
    if (dto.isActive !== undefined) test.is_active = dto.isActive;
    const saved = await this.testRepo.save(test);
    return {
      id: saved.id,
      name: saved.name,
      category: saved.category ?? undefined,
      sampleType: saved.sample_type ?? undefined,
      sampleTube: saved.sample_tube ?? undefined,
      unit: saved.unit ?? undefined,
      referenceRange: saved.reference_range ?? undefined,
      turnaroundHours: saved.turnaround_hours ?? undefined,
      isActive: saved.is_active,
    };
  }

  // ─── REQUESTS ──────────────────────────────────────────────────────────────

  /** Next LAB-YYYY-xxxxx number, atomically bumped inside the caller's transaction. */
  private async generateRequestNumber(
    qr: any,
    clinicId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LAB-${year}-`;

    const [seq] = await qr.query(
      `SELECT current_value FROM tenant_sequences
       WHERE clinic_id = $1 AND sequence_type = $2 FOR UPDATE`,
      [clinicId, SequenceType.LAB],
    );

    let nextVal: bigint;
    if (!seq) {
      nextVal = BigInt(1);
      await qr.query(
        `INSERT INTO tenant_sequences (id, clinic_id, sequence_type, current_value, prefix)
         VALUES (uuid_generate_v4(), $1, $2, '1', $3)`,
        [clinicId, SequenceType.LAB, prefix],
      );
    } else {
      nextVal = BigInt(seq.current_value) + BigInt(1);
      await qr.query(
        `UPDATE tenant_sequences SET current_value = $2, updated_at = now()
         WHERE clinic_id = $1 AND sequence_type = $3`,
        [clinicId, nextVal.toString(), SequenceType.LAB],
      );
    }

    return `${prefix}${String(nextVal).padStart(5, '0')}`;
  }

  async listRequests(
    clinicId: string,
    status?: string,
    patientId?: string,
    q?: string,
  ): Promise<ILabRequestSummary[]> {
    let sql = `
      SELECT r.id, r.patient_id AS "patientId", r.request_number AS "requestNumber",
             r.status, r.priority, r.clinical_notes AS "clinicalNotes",
             r.collected_at AS "collectedAt", r.completed_at AS "completedAt",
             r.created_at AS "requestedAt",
             p.first_name || ' ' || p.last_name AS "patientName",
             p.patient_number AS "patientNumber",
             (SELECT count(*) FROM lab_request_items ri
               WHERE ri.request_id = r.id AND ri.clinic_id = r.clinic_id)::int AS "itemCount",
             (SELECT count(*) FROM lab_request_items ri
               WHERE ri.request_id = r.id AND ri.clinic_id = r.clinic_id
                 AND ri.status = 'completed')::int AS "completedCount"
      FROM lab_requests r
      JOIN patients p ON p.id = r.patient_id AND p.clinic_id = r.clinic_id
      WHERE r.clinic_id = $1`;
    const params: Array<string | number> = [clinicId];

    if (status && LAB_STATUSES.includes(status as LabRequestStatus)) {
      sql += ` AND r.status = $${params.length + 1}`;
      params.push(status);
    }
    if (patientId) {
      sql += ` AND r.patient_id = $${params.length + 1}`;
      params.push(patientId);
    }
    if (q && q.trim()) {
      sql += ` AND (p.first_name ILIKE $${params.length + 1}
              OR p.last_name ILIKE $${params.length + 1}
              OR r.request_number ILIKE $${params.length + 1})`;
      params.push(`%${q.trim()}%`);
    }
    sql += ` ORDER BY r.created_at DESC`;

    const rows: any[] = await this.dataSource.query(sql, params);
    return rows.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      patientName: r.patientName ?? undefined,
      patientNumber: r.patientNumber ?? undefined,
      requestNumber: r.requestNumber,
      requestedAt: new Date(r.requestedAt).toISOString(),
      status: r.status,
      priority: r.priority,
      clinicalNotes: r.clinicalNotes ?? undefined,
      collectedAt: r.collectedAt ? new Date(r.collectedAt).toISOString() : undefined,
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : undefined,
      itemCount: r.itemCount,
      completedCount: r.completedCount,
    }));
  }

  async getRequest(clinicId: string, id: string): Promise<ILabRequest> {
    const [r] = await this.dataSource.query(
      `SELECT r.id, r.patient_id AS "patientId", r.request_number AS "requestNumber",
              r.status, r.priority, r.clinical_notes AS "clinicalNotes",
              r.collected_at AS "collectedAt", r.collected_by AS "collectedBy",
              r.lab_technician AS "labTechnician", r.completed_at AS "completedAt",
              r.requested_by AS "requestedBy", r.created_at AS "requestedAt",
              p.first_name || ' ' || p.last_name AS "patientName",
              p.patient_number AS "patientNumber"
       FROM lab_requests r
       JOIN patients p ON p.id = r.patient_id AND p.clinic_id = r.clinic_id
       WHERE r.clinic_id = $1 AND r.id = $2`,
      [clinicId, id],
    );
    if (!r) {
      throw new NotFoundException('Lab request not found');
    }

    const items: any[] = await this.dataSource.query(
      `SELECT ri.id, ri.test_id AS "testId", ri.status,
              ri.result_value AS "resultValue", ri.result_unit AS "resultUnit",
              ri.result_flag AS "resultFlag", ri.result_notes AS "resultNotes",
              ri.resulted_by AS "resultedBy", ri.resulted_at AS "resultedAt",
              t.name AS "testName", t.reference_range AS "referenceRange"
       FROM lab_request_items ri
       JOIN lab_tests t ON t.id = ri.test_id AND t.clinic_id = ri.clinic_id
       WHERE ri.clinic_id = $1 AND ri.request_id = $2
       ORDER BY ri.created_at ASC`,
      [clinicId, id],
    );

    return {
      id: r.id,
      patientId: r.patientId,
      patientName: r.patientName ?? undefined,
      patientNumber: r.patientNumber ?? undefined,
      requestNumber: r.requestNumber,
      requestedBy: r.requestedBy ?? undefined,
      requestedAt: new Date(r.requestedAt).toISOString(),
      status: r.status,
      priority: r.priority,
      clinicalNotes: r.clinicalNotes ?? undefined,
      collectedAt: r.collectedAt ? new Date(r.collectedAt).toISOString() : undefined,
      collectedBy: r.collectedBy ?? undefined,
      labTechnician: r.labTechnician ?? undefined,
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : undefined,
      items: items.map((it) => ({
        id: it.id,
        testId: it.testId,
        testName: it.testName,
        status: it.status,
        resultValue: it.resultValue ?? undefined,
        resultUnit: it.resultUnit ?? undefined,
        resultFlag: it.resultFlag ?? undefined,
        resultNotes: it.resultNotes ?? undefined,
        resultedBy: it.resultedBy ?? undefined,
        resultedAt: it.resultedAt ? new Date(it.resultedAt).toISOString() : undefined,
        referenceRange: it.referenceRange ?? undefined,
      })) as ILabRequestItem[],
    };
  }

  async createRequest(
    clinicId: string,
    dto: CreateLabRequestDto,
    userId: string | null,
  ): Promise<ILabRequest> {
    if (!dto.patientId) {
      throw new BadRequestException('patientId is required');
    }
    if (!dto.testIds || dto.testIds.length === 0) {
      throw new BadRequestException('At least one test must be selected');
    }

    let createdId: string | undefined;

    await this.tenantTx.runWithTenant(async (qr) => {
      const [patient] = await qr.query(
        `SELECT id FROM patients WHERE clinic_id = $1 AND id = $2`,
        [clinicId, dto.patientId],
      );
      if (!patient) {
        throw new BadRequestException('Patient not found');
      }

      const testRows: any[] = await qr.query(
        `SELECT id FROM lab_tests WHERE clinic_id = $1 AND id = ANY($2::uuid[]) AND is_active = true`,
        [clinicId, dto.testIds],
      );
      if (testRows.length !== dto.testIds.length) {
        throw new BadRequestException(
          `Only ${testRows.length} of ${dto.testIds.length} selected tests are available`,
        );
      }

      const requestNumber = await this.generateRequestNumber(qr, clinicId);

      const [header] = await qr.query(
        `INSERT INTO lab_requests
           (id, clinic_id, patient_id, visit_id, request_number, requested_by, status, priority, clinical_notes, lab_technician)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'ordered', $6, $7, $8)
         RETURNING id, created_at`,
        [
          clinicId,
          dto.patientId,
          dto.visitId || null,
          requestNumber,
          userId,
          dto.priority ?? 'routine',
          dto.clinicalNotes?.trim() || null,
          dto.labTechnicianId || null,
        ],
      );
      createdId = header.id;

      for (const testId of dto.testIds) {
        await qr.query(
          `INSERT INTO lab_request_items (id, clinic_id, request_id, test_id, status)
           VALUES (uuid_generate_v4(), $1, $2, $3, 'ordered')`,
          [clinicId, header.id, testId],
        );
      }
    });

    if (!createdId) {
      throw new Error('Failed to create lab request');
    }
    return this.getRequest(clinicId, createdId);
  }

  async updateRequest(
    clinicId: string,
    id: string,
    dto: UpdateLabRequestDto,
    userId: string | null,
  ): Promise<ILabRequest> {
    const request = await this.requestRepo.findOne({ where: { id, clinic_id: clinicId } });
    if (!request) {
      throw new NotFoundException('Lab request not found');
    }

    await this.tenantTx.runWithTenant(async (qr) => {
      if (dto.labTechnicianId !== undefined) {
        await qr.query(
          `UPDATE lab_requests SET lab_technician = $3, updated_at = now()
           WHERE clinic_id = $1 AND id = $2`,
          [clinicId, id, dto.labTechnicianId || null],
        );
      }

      if (dto.status !== undefined && dto.status !== request.status) {
        const allowed = REQUEST_TRANSITIONS[request.status] ?? [];
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException(
            `Cannot move lab request from '${request.status}' to '${dto.status}'`,
          );
        }
        if (dto.status === 'cancelled') {
          // Cancel the pending items too.
          await qr.query(
            `UPDATE lab_request_items SET status = 'cancelled', updated_at = now()
             WHERE clinic_id = $1 AND request_id = $2 AND status NOT IN ('completed','cancelled')`,
            [clinicId, id],
          );
        }
        if (dto.status === 'collected') {
          // Collecting the sample moves all pending items along.
          await qr.query(
            `UPDATE lab_request_items SET status = 'collected', updated_at = now()
             WHERE clinic_id = $1 AND request_id = $2 AND status = 'ordered'`,
            [clinicId, id],
          );
        }
        await qr.query(
          `UPDATE lab_requests SET status = $3, updated_at = now()
           WHERE clinic_id = $1 AND id = $2`,
          [clinicId, id, dto.status],
        );
        if (dto.status === 'collected') {
          await qr.query(
            `UPDATE lab_requests SET collected_at = now(), collected_by = $3, updated_at = now()
             WHERE clinic_id = $1 AND id = $2`,
            [clinicId, id, userId],
          );
        }
        if (dto.status === 'completed') {
          await qr.query(
            `UPDATE lab_requests SET completed_at = now(), updated_at = now()
             WHERE clinic_id = $1 AND id = $2`,
            [clinicId, id],
          );
        }
      }
    });

    return this.getRequest(clinicId, id);
  }

  /** Enter a result (or move an item's status) for one test on a request. */
  async updateItem(
    clinicId: string,
    requestId: string,
    itemId: string,
    dto: UpdateLabRequestItemDto,
    userId: string | null,
  ): Promise<ILabRequest> {
    await this.tenantTx.runWithTenant(async (qr) => {
      const [item] = await qr.query(
        `SELECT ri.id, ri.status, r.status AS "requestStatus"
         FROM lab_request_items ri
         JOIN lab_requests r ON r.id = ri.request_id AND r.clinic_id = ri.clinic_id
         WHERE ri.clinic_id = $1 AND ri.request_id = $2 AND ri.id = $3`,
        [clinicId, requestId, itemId],
      );
      if (!item) {
        throw new NotFoundException('Lab request item not found');
      }
      if (item.requestStatus === 'cancelled') {
        throw new BadRequestException('Cannot update a cancelled lab request');
      }

      // Status change (if explicitly requested) must be a legal move.
      if (dto.status !== undefined && dto.status !== item.status) {
        const allowed = REQUEST_TRANSITIONS[item.status] ?? [];
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException(
            `Cannot move item from '${item.status}' to '${dto.status}'`,
          );
        }
      }

      const nextStatus =
        dto.status ??
        (dto.resultValue !== undefined && dto.resultValue !== ''
          ? 'completed'
          : item.status);
      const hasResult =
        dto.resultValue !== undefined && dto.resultValue !== '';

      await qr.query(
        `UPDATE lab_request_items SET
           status = $3,
           result_value = COALESCE($4, result_value),
           result_unit = COALESCE($5, result_unit),
           result_flag = COALESCE($6, result_flag),
           result_notes = COALESCE($7, result_notes),
           resulted_by = CASE WHEN $4 IS NOT NULL THEN $8 ELSE resulted_by END,
           resulted_at = CASE WHEN $4 IS NOT NULL THEN now() ELSE resulted_at END,
           updated_at = now()
         WHERE clinic_id = $1 AND request_id = $2 AND id = $9`,
        [
          clinicId,
          requestId,
          nextStatus,
          dto.resultValue?.trim() || null,
          dto.resultUnit?.trim() || null,
          dto.resultFlag ?? null,
          dto.resultNotes?.trim() || null,
          userId,
          itemId,
        ],
      );

      // Recompute the header status from its items.
      if (item.requestStatus !== 'cancelled') {
        const rows: any[] = await qr.query(
          `SELECT status FROM lab_request_items WHERE clinic_id = $1 AND request_id = $2`,
          [clinicId, requestId],
        );
        const allDone = rows.every(
          (x) => x.status === 'completed' || x.status === 'cancelled',
        );
        const anyStarted = rows.some(
          (x) => x.status !== 'ordered' && x.status !== 'cancelled',
        );
        const nextReqStatus = allDone
          ? 'completed'
          : anyStarted
            ? 'in_progress'
            : 'ordered';
        await qr.query(
          `UPDATE lab_requests SET status = $3, updated_at = now()
           WHERE clinic_id = $1 AND id = $2`,
          [clinicId, requestId, nextReqStatus],
        );
        if (nextReqStatus === 'completed') {
          await qr.query(
            `UPDATE lab_requests SET completed_at = now(), updated_at = now()
             WHERE clinic_id = $1 AND id = $2 AND status = 'completed'`,
            [clinicId, requestId],
          );
        }
      }
    });

    return this.getRequest(clinicId, requestId);
  }
}