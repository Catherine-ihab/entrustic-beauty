import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from '../records/entities/visit.entity';
import { PatientCondition } from '../patients/entities/patient-condition.entity';
import { PatientAllergy } from '../patients/entities/patient-allergy.entity';
import { PatientMedication } from '../patients/entities/patient-medication.entity';
import { PatientFile } from '../patients/entities/patient-file.entity';
import { ConsentRecord } from '../patients/entities/consent-record.entity';
import { Invoice } from '../invoices/entities/invoice.entity';

export interface TimelineEvent {
  id: string;
  type: 'visit' | 'condition' | 'allergy' | 'medication' | 'file' | 'consent' | 'invoice';
  timestamp: string;
  title: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(PatientCondition)
    private readonly conditionRepo: Repository<PatientCondition>,
    @InjectRepository(PatientAllergy)
    private readonly allergyRepo: Repository<PatientAllergy>,
    @InjectRepository(PatientMedication)
    private readonly medicationRepo: Repository<PatientMedication>,
    @InjectRepository(PatientFile)
    private readonly fileRepo: Repository<PatientFile>,
    @InjectRepository(ConsentRecord)
    private readonly consentRepo: Repository<ConsentRecord>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  async getPatientTimeline(
    clinicId: string,
    patientId: string,
    typeFilter?: string,
  ): Promise<TimelineEvent[]> {
    const [visits, conditions, allergies, medications, files, consents, invoices] =
      await Promise.all([
        this.visitRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId },
          relations: ['provider', 'versions'],
          order: { original_visit_date: 'DESC' },
        }),
        this.conditionRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId },
          order: { created_at: 'DESC' },
        }),
        this.allergyRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId },
          order: { created_at: 'DESC' },
        }),
        this.medicationRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId },
          order: { created_at: 'DESC' },
        }),
        this.fileRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId, is_archived: false },
          order: { created_at: 'DESC' },
        }),
        this.consentRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId },
          order: { created_at: 'DESC' },
        }),
        this.invoiceRepo.find({
          where: { clinic_id: clinicId, patient_id: patientId },
          order: { created_at: 'DESC' },
        }),
      ]);

    const events: TimelineEvent[] = [];

    // Map visits
    for (const v of visits) {
      const latestVer = v.versions?.[v.versions.length - 1];
      events.push({
        id: v.id,
        type: 'visit',
        timestamp: v.original_visit_date.toISOString(),
        title: `Clinical Consultation (v${v.current_version})`,
        subtitle: v.provider ? `Dr. ${v.provider.first_name} ${v.provider.last_name}` : undefined,
        description: latestVer?.diagnosis
          ? `Diagnosis: ${latestVer.diagnosis}`
          : latestVer?.chief_complaint || undefined,
        tag: v.status.toUpperCase(),
        tagColor: v.status === 'finalized' ? 'green' : 'blue',
      });
    }

    // Map conditions
    for (const c of conditions) {
      events.push({
        id: c.id,
        type: 'condition',
        timestamp: c.created_at.toISOString(),
        title: `Chronic Condition Recorded: ${c.name}`,
        subtitle: c.icd_code ? `ICD-10: ${c.icd_code}` : undefined,
        description: c.notes || undefined,
        tag: c.status.toUpperCase(),
        tagColor: c.status === 'active' ? 'red' : 'green',
      });
    }

    // Map allergies
    for (const a of allergies) {
      events.push({
        id: a.id,
        type: 'allergy',
        timestamp: a.created_at.toISOString(),
        title: `Allergy Alert: ${a.allergen}`,
        subtitle: `Severity: ${a.severity.replace('_', ' ')}`,
        description: a.reaction ? `Reaction: ${a.reaction}` : a.notes || undefined,
        tag: a.severity === 'life_threatening' ? 'CRITICAL' : 'ALLERGY',
        tagColor: a.severity === 'life_threatening' ? 'red' : 'volcano',
      });
    }

    // Map medications
    for (const m of medications) {
      events.push({
        id: m.id,
        type: 'medication',
        timestamp: m.created_at.toISOString(),
        title: `Medication Order: ${m.name}`,
        subtitle: m.dose ? `${m.dose}${m.unit ? ` ${m.unit}` : ''} · ${m.frequency || ''}` : undefined,
        description: m.reason || m.notes || undefined,
        tag: m.is_current ? 'ACTIVE' : 'HISTORICAL',
        tagColor: m.is_current ? 'blue' : 'default',
      });
    }

    // Map files
    for (const f of files) {
      events.push({
        id: f.id,
        type: 'file',
        timestamp: f.created_at.toISOString(),
        title: `Document Uploaded: ${f.file_name}`,
        subtitle: `Category: ${f.category}`,
        description: f.description || undefined,
        tag: f.category.toUpperCase(),
        tagColor: 'purple',
      });
    }

    // Map consents
    for (const cs of consents) {
      events.push({
        id: cs.id,
        type: 'consent',
        timestamp: cs.created_at.toISOString(),
        title: `Informed Consent: ${cs.title}`,
        subtitle: `Method: ${cs.method}`,
        description: cs.notes || undefined,
        tag: cs.status.toUpperCase(),
        tagColor: cs.status === 'given' ? 'green' : 'orange',
      });
    }

    // Map invoices
    for (const inv of invoices) {
      events.push({
        id: inv.id,
        type: 'invoice',
        timestamp: inv.created_at.toISOString(),
        title: `Invoice Generated: ${inv.invoice_number}`,
        subtitle: `Amount: ${inv.total} ${inv.currency}`,
        tag: inv.status.toUpperCase(),
        tagColor: inv.status === 'paid' ? 'green' : 'orange',
      });
    }

    // Filter if requested
    const filtered = typeFilter && typeFilter !== 'all'
      ? events.filter((e) => e.type === typeFilter)
      : events;

    // Sort descending by timestamp
    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
