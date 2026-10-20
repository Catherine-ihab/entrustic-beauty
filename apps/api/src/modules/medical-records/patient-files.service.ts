import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientFile } from '../patients/entities/patient-file.entity';

@Injectable()
export class PatientFilesService {
  constructor(
    @InjectRepository(PatientFile)
    private readonly repo: Repository<PatientFile>,
  ) {}

  async findAll(clinicId: string, patientId: string, query?: { category?: string; visitId?: string }) {
    const qb = this.repo.createQueryBuilder('f')
      .where('f.clinic_id = :clinicId AND f.patient_id = :patientId AND f.is_archived = false', { clinicId, patientId });
    if (query?.category) qb.andWhere('f.category = :cat', { cat: query.category });
    if (query?.visitId) qb.andWhere('f.visit_id = :vid', { vid: query.visitId });
    return qb.orderBy('f.created_at', 'DESC').getMany();
  }

  async create(clinicId: string, patientId: string, dto: any, userId: string) {
    const file = this.repo.create({ ...dto, clinic_id: clinicId, patient_id: patientId, uploaded_by: userId });
    return this.repo.save(file);
  }

  async archive(clinicId: string, patientId: string, id: string) {
    const file = await this.repo.findOne({ where: { id, clinic_id: clinicId, patient_id: patientId } });
    if (!file) throw new NotFoundException('File not found');
    file.is_archived = true;
    return this.repo.save(file);
  }

  async getDownloadUrl(clinicId: string, patientId: string, id: string): Promise<{ url: string; expiresIn: number }> {
    const file = await this.repo.findOne({ where: { id, clinic_id: clinicId, patient_id: patientId } });
    if (!file) throw new NotFoundException('File not found');
    return {
      url: `https://storage.example.com/${file.storage_bucket}/${file.storage_key}?token=presigned`,
      expiresIn: 3600,
    };
  }
}
