import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from './entities/visit.entity';
import { VisitVersion } from './entities/visit-version.entity';
import { VisitMeasurement } from './entities/visit-measurement.entity';
import { VisitDiagnosis } from './entities/visit-diagnosis.entity';
import { CreateVisitDto, AmendVisitDto, VisitStatus } from '@clinic/shared-types';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(VisitVersion)
    private readonly versionRepo: Repository<VisitVersion>,
    @InjectRepository(VisitMeasurement)
    private readonly measurementRepo: Repository<VisitMeasurement>,
    @InjectRepository(VisitDiagnosis)
    private readonly diagnosisRepo: Repository<VisitDiagnosis>,
  ) {}

  async create(clinicId: string, authorId: string, dto: CreateVisitDto): Promise<Visit> {
    const visit = this.visitRepo.create({
      clinic_id: clinicId,
      patient_id: dto.patientId,
      appointment_id: dto.appointmentId || null,
      provider_id: dto.providerId,
      original_visit_date: new Date(),
      status: VisitStatus.FINALIZED,
      current_version: 1,
    });

    const savedVisit = await this.visitRepo.save(visit);

    const initialVersion = this.versionRepo.create({
      clinic_id: clinicId,
      visit_id: savedVisit.id,
      version_number: 1,
      chief_complaint: dto.chiefComplaint || null,
      diagnosis: dto.diagnosis || null,
      treatment_plan: dto.treatmentPlan || null,
      clinical_notes: dto.clinicalNotes || null,
      follow_up_date: dto.followUpDate || null,
      custom_fields: dto.customFields || {},
      changed_by: authorId,
      change_reason: 'Initial consultation record',
    });

    await this.versionRepo.save(initialVersion);

    return this.findOne(clinicId, savedVisit.id);
  }

  async amend(
    clinicId: string,
    visitId: string,
    authorId: string,
    dto: AmendVisitDto,
  ): Promise<Visit> {
    if (!dto.changeReason || dto.changeReason.trim().length === 0) {
      throw new BadRequestException('A reason for the amendment is mandatory for medical compliance.');
    }

    const visit = await this.findOne(clinicId, visitId);

    const nextVersionNumber = visit.current_version + 1;

    const newVersion = this.versionRepo.create({
      clinic_id: clinicId,
      visit_id: visit.id,
      version_number: nextVersionNumber,
      chief_complaint: dto.chiefComplaint,
      diagnosis: dto.diagnosis,
      treatment_plan: dto.treatmentPlan,
      clinical_notes: dto.clinicalNotes,
      follow_up_date: dto.followUpDate,
      custom_fields: dto.customFields || {},
      change_reason: dto.changeReason,
      changed_by: authorId,
    });

    await this.versionRepo.save(newVersion);

    visit.current_version = nextVersionNumber;
    visit.status = VisitStatus.AMENDED;
    await this.visitRepo.save(visit);

    return this.findOne(clinicId, visitId);
  }

  async findByPatient(clinicId: string, patientId: string): Promise<Visit[]> {
    return this.visitRepo.find({
      where: { clinic_id: clinicId, patient_id: patientId },
      relations: ['provider', 'versions', 'versions.author'],
      order: { original_visit_date: 'DESC' },
    });
  }

  async findLastByPatient(clinicId: string, patientId: string): Promise<Visit | null> {
    const visits = await this.visitRepo.find({
      where: { clinic_id: clinicId, patient_id: patientId },
      relations: ['provider', 'versions', 'versions.author'],
      order: { original_visit_date: 'DESC' },
      take: 1,
    });
    return visits.length > 0 ? visits[0] : null;
  }

  async findOne(clinicId: string, id: string): Promise<Visit> {
    const visit = await this.visitRepo.findOne({
      where: { id, clinic_id: clinicId },
      relations: ['provider', 'versions', 'versions.author'],
      order: {
        versions: {
          version_number: 'ASC',
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Medical visit record not found');
    }

    return visit;
  }

  async getMeasurements(clinicId: string, visitId: string): Promise<VisitMeasurement[]> {
    return this.measurementRepo.find({
      where: { clinic_id: clinicId, visit_id: visitId },
      order: { recorded_at: 'ASC' },
    });
  }

  async addMeasurement(
    clinicId: string,
    visitId: string,
    patientId: string,
    dto: { key: string; value: number; unit: string; notes?: string },
    authorId: string,
  ): Promise<VisitMeasurement> {
    const measurement = this.measurementRepo.create({
      clinic_id: clinicId,
      visit_id: visitId,
      patient_id: patientId,
      key: dto.key,
      value: dto.value,
      unit: dto.unit,
      notes: dto.notes || null,
      created_by: authorId,
    });
    return this.measurementRepo.save(measurement);
  }

  async getDiagnoses(clinicId: string, visitId: string): Promise<VisitDiagnosis[]> {
    return this.diagnosisRepo.find({
      where: { clinic_id: clinicId, visit_id: visitId },
      order: { created_at: 'ASC' },
    });
  }

  async addDiagnosis(
    clinicId: string,
    visitId: string,
    dto: { code?: string; description: string; is_primary?: boolean; notes?: string },
  ): Promise<VisitDiagnosis> {
    const diagnosis = this.diagnosisRepo.create({
      clinic_id: clinicId,
      visit_id: visitId,
      code: dto.code || null,
      description: dto.description,
      is_primary: !!dto.is_primary,
      notes: dto.notes || null,
    });
    return this.diagnosisRepo.save(diagnosis);
  }
}
