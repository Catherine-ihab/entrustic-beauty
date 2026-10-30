import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueEntry } from './entities/queue-entry.entity';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueEntryDto } from './dto/update-queue-entry.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly repo: Repository<QueueEntry>,
  ) {}

  async findAll(clinicId: string): Promise<QueueEntry[]> {
    return this.repo.find({
      where: { clinic_id: clinicId },
      order: { added_at: 'DESC' },
    });
  }

  async create(clinicId: string, dto: CreateQueueEntryDto): Promise<QueueEntry> {
    const entry = this.repo.create({
      clinic_id: clinicId,
      patient_id: dto.patientId || randomUUID(),
      patient_name: dto.patientName,
      patient_phone: dto.patientPhone,
      patient_number: dto.patientNumber || null,
      service_name: dto.serviceName,
      service_category: dto.serviceCategory as any,
      package_name: dto.packageName || null,
      package_session_number: dto.packageSessionNumber || null,
      package_total_sessions: dto.packageTotalSessions || null,
      invoice_id: dto.invoiceId || null,
      invoice_number: dto.invoiceNumber || null,
      paid_amount: dto.paidAmount ?? null,
      total_amount: dto.totalAmount ?? null,
      is_paid: !!dto.isPaid,
      scheduled_time: dto.scheduledTime,
      status: (dto.status as any) || 'waiting',
      practitioner: dto.practitioner || null,
      doctor_notes: dto.doctorNotes || null,
      started_at: null,
      completed_at: null,
    });
    return this.repo.save(entry);
  }

  async update(clinicId: string, id: string, dto: UpdateQueueEntryDto): Promise<QueueEntry> {
    const entry = await this.repo.findOne({ where: { id, clinic_id: clinicId } });
    if (!entry) throw new NotFoundException('Queue entry not found');

    if (dto.status) {
      entry.status = dto.status as any;
      if (dto.status === 'in-progress' && !entry.started_at) {
        entry.started_at = new Date();
      }
      if ((dto.status === 'done' || dto.status === 'completed') && !entry.completed_at) {
        entry.completed_at = new Date();
      }
    }
    if (dto.practitioner !== undefined) entry.practitioner = dto.practitioner;
    if (dto.doctorNotes !== undefined) entry.doctor_notes = dto.doctorNotes;
    if (dto.paidAmount !== undefined) entry.paid_amount = dto.paidAmount as any;
    if (dto.isPaid !== undefined) entry.is_paid = dto.isPaid;

    return this.repo.save(entry);
  }

  async remove(clinicId: string, id: string): Promise<void> {
    const entry = await this.repo.findOne({ where: { id, clinic_id: clinicId } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    await this.repo.remove(entry);
  }

  async clear(clinicId: string): Promise<void> {
    await this.repo.delete({ clinic_id: clinicId });
  }
}
