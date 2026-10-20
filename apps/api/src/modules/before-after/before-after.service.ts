import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeforeAfterRecord } from './entities/before-after-record.entity';
import { BeforeAfterImage } from './entities/before-after-image.entity';
import { CreateBeforeAfterRecordDto, IBeforeAfterRecord } from '@clinic/shared-types';

@Injectable()
export class BeforeAfterService {
  constructor(
    @InjectRepository(BeforeAfterRecord)
    private readonly recordRepo: Repository<BeforeAfterRecord>,
    @InjectRepository(BeforeAfterImage)
    private readonly imageRepo: Repository<BeforeAfterImage>,
  ) {}

  async create(
    clinicId: string,
    userId: string,
    dto: CreateBeforeAfterRecordDto,
  ): Promise<IBeforeAfterRecord> {
    const record = this.recordRepo.create({
      clinic_id: clinicId,
      patient_id: dto.patientId,
      title: dto.title,
      treatment_description: dto.treatmentDescription || null,
      notes: dto.notes || null,
      recorded_date: dto.recordedDate,
      created_by: userId,
    });

    const savedRecord = await this.recordRepo.save(record);

    if (dto.images && dto.images.length > 0) {
      for (const imgDto of dto.images) {
        const img = this.imageRepo.create({
          clinic_id: clinicId,
          record_id: savedRecord.id,
          image_type: imgDto.imageType,
          storage_key: imgDto.storageKey,
          caption: imgDto.caption || null,
          taken_at: imgDto.takenAt ? new Date(imgDto.takenAt) : new Date(),
        });
        await this.imageRepo.save(img);
      }
    }

    return this.findOne(clinicId, savedRecord.id);
  }

  async findByPatient(clinicId: string, patientId: string): Promise<IBeforeAfterRecord[]> {
    const records = await this.recordRepo.find({
      where: { clinic_id: clinicId, patient_id: patientId },
      relations: ['images'],
      order: { recorded_date: 'DESC' },
    });

    return records.map((r) => this.mapRecord(r));
  }

  async findOne(clinicId: string, id: string): Promise<IBeforeAfterRecord> {
    const record = await this.recordRepo.findOne({
      where: { id, clinic_id: clinicId },
      relations: ['images'],
    });

    if (!record) {
      throw new NotFoundException('Before/After record not found');
    }

    return this.mapRecord(record);
  }

  private mapRecord(r: BeforeAfterRecord): IBeforeAfterRecord {
    return {
      id: r.id,
      clinicId: r.clinic_id,
      patientId: r.patient_id,
      title: r.title,
      treatmentDescription: r.treatment_description,
      notes: r.notes,
      recordedDate: r.recorded_date,
      createdBy: r.created_by,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      images: (r.images || []).map((img) => ({
        id: img.id,
        clinicId: img.clinic_id,
        recordId: img.record_id,
        storageKey: img.storage_key,
        url: `https://storage.yourplatform.com/${img.storage_key}?token=mock-presigned-secure-token`,
        imageType: img.image_type,
        caption: img.caption,
        takenAt: img.taken_at ? img.taken_at.toISOString() : null,
        createdAt: img.created_at.toISOString(),
      })),
    };
  }
}
