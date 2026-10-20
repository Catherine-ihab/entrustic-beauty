import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { Drug } from './entities/drug.entity';
import { DrugInteraction } from './entities/drug-interaction.entity';
import {
  IDrug,
  CreatePrescriptionDto,
  CreatePrescriptionItemDto,
  PrescriptionWarning,
} from '@clinic/shared-types';

/** Sort warnings so the most severe bubble to the top. */
const SEVERITY_WEIGHT: Record<string, number> = {
  life_threatening: 5,
  major: 4,
  moderate: 3,
  minor: 2,
};

function toDrugDto(d: Drug): IDrug {
  return {
    id: d.id,
    name: d.name,
    genericName: d.generic_name ?? undefined,
    category: d.category ?? undefined,
    form: d.form ?? undefined,
    strength: d.strength ?? undefined,
    substances: d.substances ?? [],
    commonDoses: d.common_doses ?? undefined,
    isSeed: d.is_seed,
  };
}

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Drug) private readonly drugRepo: Repository<Drug>,
    @InjectRepository(DrugInteraction)
    private readonly interactionRepo: Repository<DrugInteraction>,
    private readonly dataSource: DataSource,
    private readonly tenantTx: TenantTransactionManager,
  ) {}

  // ─── Drug catalog ─────────────────────────────────────────────────────────
  async listDrugs(clinicId: string, q?: string): Promise<IDrug[]> {
    const builder = this.drugRepo
      .createQueryBuilder('d')
      .where('d.clinic_id = :clinicId', { clinicId })
      .orderBy('d.name', 'ASC');
    if (q && q.trim()) {
      const like = `%${q.trim()}%`;
      builder.andWhere(
        `(d.name ILIKE :q OR d.generic_name ILIKE :q OR d.category ILIKE :q OR d.strength ILIKE :q)`,
        { q: like },
      );
    }
    const rows = await builder.take(100).getMany();
    return rows.map(toDrugDto);
  }

  async createDrug(
    clinicId: string,
    dto: {
      name: string;
      genericName?: string;
      category?: string;
      form?: string;
      strength?: string;
      substances?: string[];
      commonDoses?: string;
    },
  ): Promise<IDrug> {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Drug name is required');
    }
    const drug = this.drugRepo.create({
      clinic_id: clinicId,
      name: dto.name.trim(),
      generic_name: dto.genericName?.trim() || null,
      category: dto.category?.trim() || null,
      form: dto.form?.trim() || null,
      strength: dto.strength?.trim() || null,
      substances: (dto.substances ?? [])
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      common_doses: dto.commonDoses?.trim() || null,
      is_seed: false,
    });
    const saved = await this.drugRepo.save(drug);
    return toDrugDto(saved);
  }

  async getInteractions(
    clinicId: string,
    drugId: string,
  ): Promise<Array<{ drugA: string; drugB: string; severity: string; advice: string | null }>> {
    const rows = await this.interactionRepo.find({
      where: [
        { clinic_id: clinicId, drug_a_id: drugId },
        { clinic_id: clinicId, drug_b_id: drugId },
      ] as any,
      relations: ['drugA', 'drugB'],
    });
    return rows.map((r) => ({
      drugA: r.drugA?.name ?? '',
      drugB: r.drugB?.name ?? '',
      severity: r.severity,
      advice: r.advice,
    }));
  }

  // ─── Safety checks (no side effects) ─────────────────────────────────────
  async checkSafety(
    clinicId: string,
    patientId: string | null,
    items: CreatePrescriptionItemDto[],
  ): Promise<PrescriptionWarning[]> {
    const warnings: PrescriptionWarning[] = [];
    const drugIds = [...new Set(items.map((i) => i.drugId).filter((id): id is string => !!id))];
    if (drugIds.length === 0) return warnings;

    const drugs = await this.drugRepo
      .createQueryBuilder('d')
      .where('d.clinic_id = :clinicId')
      .andWhere({ id: In(drugIds) })
      .setParameter('clinicId', clinicId)
      .getMany();
    const drugMap = new Map(drugs.map((d) => [d.id, d]));

    // 1) Drug–drug interactions among the selected drugs.
    const pool = await this.interactionRepo.find({
      where: [
        { clinic_id: clinicId, drug_a_id: In(drugIds) },
        { clinic_id: clinicId, drug_b_id: In(drugIds) },
      ],
      relations: ['drugA', 'drugB'],
    });
    const seen = new Set<string>();
    for (const r of pool) {
      if (!drugMap.has(r.drugA.id) || !drugMap.has(r.drugB.id)) continue;
      const key = [r.drugA.id, r.drugB.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push({
        type: 'drug_interaction',
        severity: r.severity as PrescriptionWarning['severity'],
        message: `${r.drugA.name} + ${r.drugB.name}: ${r.advice ?? 'possible interaction'}`,
        drugs: [r.drugA.name, r.drugB.name],
      });
    }

    // 2) Allergy alert — each item drug checked against the patient's active allergies.
    if (patientId) {
      const allergyRows: Array<{ allergen: string; severity: string }> =
        await this.dataSource.query(
          `SELECT allergen, severity FROM patient_allergies
           WHERE clinic_id = $1 AND patient_id = $2 AND lower(status) = 'active'`,
          [clinicId, patientId],
        );
      for (const item of items) {
        const drug = item.drugId ? drugMap.get(item.drugId) : null;
        const haystack = [
          drug?.name ?? item.drugName ?? '',
          drug?.generic_name ?? '',
          ...(drug?.substances ?? []),
        ]
          .join(' ')
          .toLowerCase();
        for (const allergy of allergyRows) {
          if (haystack.includes(allergy.allergen.toLowerCase())) {
            const severity =
              allergy.severity === 'life_threatening'
                ? 'life_threatening'
                : allergy.severity === 'severe'
                  ? 'major'
                  : allergy.severity === 'moderate'
                    ? 'moderate'
                    : 'minor';
            warnings.push({
              type: 'allergy',
              severity: severity as PrescriptionWarning['severity'],
              message: `Allergy alert: ${drug?.name ?? item.drugName} contains ${allergy.allergen} — patient is allergic`,
              allergen: allergy.allergen,
              drugName: drug?.name ?? item.drugName,
            });
          }
        }
      }
    }

    warnings.sort(
      (a, b) =>
        (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0),
    );
    return warnings;
  }

  // ─── Prescriptions ───────────────────────────────────────────────────────
  async createPrescription(
    clinicId: string,
    providerId: string,
    dto: CreatePrescriptionDto,
  ): Promise<{ prescriptionId: string; warnings: PrescriptionWarning[] }> {
    if (!dto.items?.length) {
      throw new BadRequestException('Prescription must contain at least one item');
    }

    const warnings = await this.checkSafety(clinicId, dto.patientId, dto.items);

    const prescriptionId = await this.tenantTx.runWithTenant<string>(async (qr) => {
      const [rx] = await qr.query(
        `INSERT INTO prescriptions (id, clinic_id, patient_id, visit_id, provider_id, status, notes)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'issued', $5)
         RETURNING id`,
        [clinicId, dto.patientId, dto.visitId || null, providerId, dto.notes || null],
      );

      let order = 0;
      for (const item of dto.items) {
        await qr.query(
          `INSERT INTO prescription_items
             (id, clinic_id, prescription_id, drug_id, drug_name, dose, frequency, duration, instructions, quantity, sort_order)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            clinicId,
            rx.id,
            item.drugId || null,
            item.drugName || '',
            item.dose || null,
            item.frequency || null,
            item.duration || null,
            item.instructions || null,
            item.quantity ?? null,
            order++,
          ],
        );

        // Track favorites for 1-click prescribing.
        if (item.drugId) {
          await qr.query(
            `INSERT INTO doctor_favorite_drugs (id, clinic_id, doctor_id, drug_id, usage_count, last_used_at)
             VALUES (uuid_generate_v4(), $1, $2, $3, 1, now())
             ON CONFLICT (clinic_id, doctor_id, drug_id)
             DO UPDATE SET usage_count = doctor_favorite_drugs.usage_count + 1, last_used_at = now()`,
            [clinicId, providerId, item.drugId],
          );
        }
      }

      await qr.query(
        `INSERT INTO audit_logs (id, clinic_id, user_id, action, entity_type, entity_id, changes)
         VALUES (uuid_generate_v4(), $1, $2, 'CREATE', 'prescription', $3, $4)`,
        [clinicId, providerId, rx.id, JSON.stringify({ items: dto.items.length })],
      );

      return rx.id as string;
    });

    return { prescriptionId, warnings };
  }

  async listPrescriptions(
    clinicId: string,
    patientId?: string,
  ): Promise<Array<Record<string, any>>> {
    const where = patientId
      ? 'WHERE p.clinic_id = $1 AND p.patient_id = $2'
      : 'WHERE p.clinic_id = $1';
    const params = patientId ? [clinicId, patientId] : [clinicId];
    return this.dataSource.query(
      `
      SELECT p.id, p.patient_id AS "patientId", p.visit_id AS "visitId",
             p.provider_id AS "providerId", p.issued_at AS "issuedAt", p.status, p.notes,
             COALESCE(json_agg(
               json_build_object('id', pi.id, 'drugId', pi.drug_id, 'drugName', pi.drug_name,
                                 'dose', pi.dose, 'frequency', pi.frequency, 'duration', pi.duration,
                                 'instructions', pi.instructions, 'quantity', pi.quantity)
               ORDER BY pi.sort_order
             ) FILTER (WHERE pi.id IS NOT NULL), '[]') AS items
      FROM prescriptions p
      LEFT JOIN prescription_items pi ON pi.prescription_id = p.id
      ${where}
      GROUP BY p.id
      ORDER BY p.issued_at DESC
    `,
      params,
    );
  }

  async getFavorites(
    clinicId: string,
    doctorId: string,
    limit = 5,
  ): Promise<Array<Record<string, any>>> {
    return this.dataSource.query(
      `
      SELECT f.drug_id AS "drugId", f.usage_count AS "usageCount",
             f.last_used_at AS "lastUsedAt",
             d.name, d.generic_name AS "genericName", d.category, d.form,
             d.strength, d.common_doses AS "commonDoses"
      FROM doctor_favorite_drugs f
      JOIN drugs d ON d.id = f.drug_id AND d.clinic_id = f.clinic_id
      WHERE f.clinic_id = $1 AND f.doctor_id = $2
      ORDER BY f.usage_count DESC, f.last_used_at DESC
      LIMIT $3
    `,
      [clinicId, doctorId, limit],
    );
  }
}