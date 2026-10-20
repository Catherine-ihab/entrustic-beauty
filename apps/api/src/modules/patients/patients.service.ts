import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { TenantSequence } from '../tenants/entities/tenant-sequence.entity';
import { SequenceType, CreatePatientDto, UpdatePatientDto } from '@clinic/shared-types';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
  ) {}

  private async generatePatientNumber(clinicId: string): Promise<string> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      let seq = await qr.manager.findOne(TenantSequence, {
        where: { clinic_id: clinicId, sequence_type: SequenceType.PATIENT },
        lock: { mode: 'pessimistic_write' },
      });

      if (!seq) {
        seq = qr.manager.create(TenantSequence, {
          clinic_id: clinicId,
          sequence_type: SequenceType.PATIENT,
          current_value: '1',
          prefix: 'PAT-',
        });
        await qr.manager.save(seq);
        await qr.commitTransaction();
        return `PAT-${String(1).padStart(5, '0')}`;
      }

      const nextVal = BigInt(seq.current_value) + BigInt(1);
      seq.current_value = nextVal.toString();
      await qr.manager.save(seq);
      await qr.commitTransaction();

      return `${seq.prefix}${String(nextVal).padStart(5, '0')}`;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async create(clinicId: string, dto: CreatePatientDto): Promise<Patient> {
    const patientNumber = await this.generatePatientNumber(clinicId);

    const patient = this.patientRepo.create({
      ...dto,
      clinic_id: clinicId,
      patient_number: patientNumber,
    });

    return this.patientRepo.save(patient);
  }

  async findAll(
    clinicId: string,
    query: { page?: number; limit?: number; search?: string },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.patientRepo
      .createQueryBuilder('patient')
      .where('patient.clinic_id = :clinicId', { clinicId });

    if (query.search) {
      qb.andWhere(
        '(patient.first_name ILIKE :s OR patient.last_name ILIKE :s OR patient.patient_number ILIKE :s OR patient.phone ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    qb.orderBy('patient.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(clinicId: string, id: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({
      where: { id, clinic_id: clinicId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async update(clinicId: string, id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(clinicId, id);
    Object.assign(patient, dto);
    return this.patientRepo.save(patient);
  }

  async remove(clinicId: string, id: string): Promise<{ deleted: boolean }> {
    const patient = await this.findOne(clinicId, id);
    await this.patientRepo.softRemove(patient);
    return { deleted: true };
  }
}
