import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from '@clinic/shared-types';

const CLINIC_ID = 'clinic-uuid-0001';
const PROVIDER_ID = 'provider-uuid-1111';
const PATIENT_ID = 'patient-uuid-1111';

// Build a fluent QueryBuilder mock
const makeQb = (existingAppt: any = null) => {
  const qb: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(existingAppt),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
};

const makeAppt = (overrides: Partial<Appointment> = {}): Appointment =>
  Object.assign(new Appointment(), {
    id: 'appt-uuid-1',
    clinic_id: CLINIC_ID,
    patient_id: PATIENT_ID,
    provider_id: PROVIDER_ID,
    start_time: new Date('2026-10-10T09:00:00Z'),
    end_time: new Date('2026-10-10T10:00:00Z'),
    status: AppointmentStatus.SCHEDULED,
    notes: null,
    cancellation_reason: null,
    ...overrides,
  });

describe('AppointmentsService — Scheduling Conflict Detection', () => {
  let service: AppointmentsService;
  let apptRepoMock: any;

  beforeEach(async () => {
    apptRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: apptRepoMock,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('create — conflict detection', () => {
    it('should create an appointment when no overlapping booking exists', async () => {
      const qb = makeQb(null); // no conflict
      apptRepoMock.createQueryBuilder.mockReturnValue(qb);
      const newAppt = makeAppt();
      apptRepoMock.create.mockReturnValue(newAppt);
      apptRepoMock.save.mockResolvedValue(newAppt);

      const result = await service.create(CLINIC_ID, 'user-id', {
        patientId: PATIENT_ID,
        providerId: PROVIDER_ID,
        startTime: '2026-10-10T09:00:00Z',
        endTime: '2026-10-10T10:00:00Z',
      });

      expect(result).toBeDefined();
      expect(apptRepoMock.save).toHaveBeenCalled();
    });

    it('CONFLICT: should reject an appointment that overlaps an existing one', async () => {
      const existingAppt = makeAppt({ id: 'existing-appt' });
      const qb = makeQb(existingAppt);
      apptRepoMock.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.create(CLINIC_ID, 'user-id', {
          patientId: PATIENT_ID,
          providerId: PROVIDER_ID,
          startTime: '2026-10-10T09:30:00Z',
          endTime: '2026-10-10T10:30:00Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('VALIDATION: should reject when end time is before start time', async () => {
      const qb = makeQb(null);
      apptRepoMock.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.create(CLINIC_ID, 'user-id', {
          patientId: PATIENT_ID,
          providerId: PROVIDER_ID,
          startTime: '2026-10-10T11:00:00Z',
          endTime: '2026-10-10T09:00:00Z', // end before start
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('BOUNDARY: back-to-back booking should be allowed when no conflict is found', async () => {
      const qb = makeQb(null);
      apptRepoMock.createQueryBuilder.mockReturnValue(qb);
      const newAppt = makeAppt({
        id: 'appt-uuid-2',
        start_time: new Date('2026-10-10T10:00:00Z'),
        end_time: new Date('2026-10-10T11:00:00Z'),
      });
      apptRepoMock.create.mockReturnValue(newAppt);
      apptRepoMock.save.mockResolvedValue(newAppt);

      const result = await service.create(CLINIC_ID, 'user-id', {
        patientId: 'patient-uuid-2222',
        providerId: PROVIDER_ID,
        startTime: '2026-10-10T10:00:00Z',
        endTime: '2026-10-10T11:00:00Z',
      });

      expect(result).toBeDefined();
    });

    it('ISOLATION: conflict check query must include clinic_id to prevent cross-clinic false positives', async () => {
      const qb = makeQb(null);
      apptRepoMock.createQueryBuilder.mockReturnValue(qb);
      const newAppt = makeAppt({ id: 'appt-uuid-3' });
      apptRepoMock.create.mockReturnValue(newAppt);
      apptRepoMock.save.mockResolvedValue(newAppt);

      await service.create(CLINIC_ID, 'user-id', {
        patientId: PATIENT_ID,
        providerId: PROVIDER_ID,
        startTime: '2026-10-10T14:00:00Z',
        endTime: '2026-10-10T15:00:00Z',
      });

      // where() must be called with clinic_id to scope the conflict check to this clinic only
      expect(qb.where).toHaveBeenCalledWith(
        'appt.clinic_id = :clinicId',
        { clinicId: CLINIC_ID },
      );
    });
  });
});
