import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentRecord } from '../patients/entities/consent-record.entity';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(ConsentRecord)
    private readonly repo: Repository<ConsentRecord>,
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
}
