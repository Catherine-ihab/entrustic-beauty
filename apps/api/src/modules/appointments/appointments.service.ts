import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import {
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  VisitType,
} from '@clinic/shared-types';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  private async assertNoSchedulingConflict(
    clinicId: string,
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time.');
    }

    const qb = this.appointmentRepo
      .createQueryBuilder('appt')
      .where('appt.clinic_id = :clinicId', { clinicId })
      .andWhere('appt.provider_id = :providerId', { providerId })
      .andWhere('appt.status NOT IN (:...cancelledStatuses)', {
        cancelledStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere('appt.start_time < :endTime AND appt.end_time > :startTime', {
        startTime,
        endTime,
      });

    if (excludeId) {
      qb.andWhere('appt.id != :excludeId', { excludeId });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        'The selected provider already has an appointment during this time slot.',
      );
    }
  }

  async create(
    clinicId: string,
    // Nullable: patient-portal bookings carry no staff user (created_by FK allows NULL).
    userId: string | null,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    await this.assertNoSchedulingConflict(clinicId, dto.providerId, start, end);

    const visitType =
      dto.visitType === VisitType.TELEMEDICINE
        ? VisitType.TELEMEDICINE
        : VisitType.IN_PERSON;

    // Entity columns are snake_case — map the camelCase DTO explicitly
    // (spreading dto would silently leave patient_id/provider_id NULL).
    const appt = this.appointmentRepo.create({
      patient_id: dto.patientId,
      provider_id: dto.providerId,
      service_id: dto.serviceId ?? null,
      clinic_id: clinicId,
      created_by: userId,
      start_time: start,
      end_time: end,
      notes: dto.notes ?? null,
      status: AppointmentStatus.SCHEDULED,
      visit_type: visitType,
      room_code: visitType === VisitType.TELEMEDICINE ? this.generateRoomCode() : null,
    });

    return this.saveWithRoomRetry(appt);
  }

  /** 'RM-XXXXXX' — unique per clinic; collisions retry against the partial index. */
  private generateRoomCode(): string {
    return `RM-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private async saveWithRoomRetry(appt: Appointment): Promise<Appointment> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.appointmentRepo.save(appt);
      } catch (err: any) {
        const code = err?.code ?? err?.driverError?.code;
        if (appt.room_code && code === '23505') {
          appt.room_code = this.generateRoomCode();
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async findAll(
    clinicId: string,
    query: {
      providerId?: string;
      patientId?: string;
      startDate?: string;
      endDate?: string;
      status?: AppointmentStatus;
    },
  ): Promise<Appointment[]> {
    const qb = this.appointmentRepo
      .createQueryBuilder('appt')
      .leftJoinAndSelect('appt.patient', 'patient')
      .leftJoinAndSelect('appt.provider', 'provider')
      .leftJoinAndSelect('appt.service', 'service')
      .where('appt.clinic_id = :clinicId', { clinicId });

    if (query.providerId) {
      qb.andWhere('appt.provider_id = :providerId', { providerId: query.providerId });
    }

    if (query.patientId) {
      qb.andWhere('appt.patient_id = :patientId', { patientId: query.patientId });
    }

    if (query.status) {
      qb.andWhere('appt.status = :status', { status: query.status });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('appt.start_time BETWEEN :start AND :end', {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      });
    }

    qb.orderBy('appt.start_time', 'ASC');

    return qb.getMany();
  }

  async findOne(clinicId: string, id: string): Promise<Appointment> {
    const appt = await this.appointmentRepo.findOne({
      where: { id, clinic_id: clinicId },
      relations: ['patient', 'provider', 'service'],
    });

    if (!appt) {
      throw new NotFoundException('Appointment not found');
    }

    return appt;
  }

  async update(
    clinicId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appt = await this.findOne(clinicId, id);

    if (dto.startTime || dto.endTime) {
      const newStart = dto.startTime ? new Date(dto.startTime) : appt.start_time;
      const newEnd = dto.endTime ? new Date(dto.endTime) : appt.end_time;

      await this.assertNoSchedulingConflict(
        clinicId,
        appt.provider_id,
        newStart,
        newEnd,
        appt.id,
      );

      appt.start_time = newStart;
      appt.end_time = newEnd;
    }

    if (dto.status) {
      appt.status = dto.status as AppointmentStatus;
    }

    if (dto.notes !== undefined) {
      appt.notes = dto.notes;
    }

    if (dto.cancellationReason !== undefined) {
      appt.cancellation_reason = dto.cancellationReason;
    }

    return this.appointmentRepo.save(appt);
  }

  async cancel(clinicId: string, id: string, reason?: string): Promise<Appointment> {
    const appt = await this.findOne(clinicId, id);
    appt.status = AppointmentStatus.CANCELLED;
    if (reason) {
      appt.cancellation_reason = reason;
    }
    return this.appointmentRepo.save(appt);
  }
}
