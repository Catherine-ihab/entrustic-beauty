import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientMedication } from '../patients/entities/patient-medication.entity';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectRepository(PatientMedication)
    private readonly repo: Repository<PatientMedication>,
  ) {}

  async findAll(clinicId: string, patientId: string) {
    return this.repo.find({
      where: { clinic_id: clinicId, patient_id: patientId },
      order: { created_at: 'DESC' },
    });
  }

  async create(clinicId: string, patientId: string, dto: any, userId: string) {
    const record = this.repo.create({
      ...dto,
      clinic_id: clinicId,
      patient_id: patientId,
      created_by: userId,
    });
    return this.repo.save(record);
  }

  async update(clinicId: string, patientId: string, id: string, dto: any) {
    const record = await this.repo.findOne({ where: { id, clinic_id: clinicId, patient_id: patientId } });
    if (!record) throw new NotFoundException('Medication not found');
    Object.assign(record, dto);
    return this.repo.save(record);
  }
}
