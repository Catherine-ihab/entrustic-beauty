import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitDiagnosis } from '../records/entities/visit-diagnosis.entity';

@Injectable()
export class DiagnosesService {
  constructor(
    @InjectRepository(VisitDiagnosis)
    private readonly repo: Repository<VisitDiagnosis>,
  ) {}

  async findAll(clinicId: string, visitId: string) {
    return this.repo.find({
      where: { clinic_id: clinicId, visit_id: visitId },
      order: { created_at: 'DESC' },
    });
  }

  async create(clinicId: string, visitId: string, dto: any) {
    const record = this.repo.create({
      ...dto,
      clinic_id: clinicId,
      visit_id: visitId,
    });
    return this.repo.save(record);
  }
}
