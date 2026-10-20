import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecordsService } from './records.service';
import { Visit } from './entities/visit.entity';
import { VisitVersion } from './entities/visit-version.entity';
import { VisitMeasurement } from './entities/visit-measurement.entity';
import { VisitDiagnosis } from './entities/visit-diagnosis.entity';
import { VisitStatus } from '@clinic/shared-types';

const CLINIC_ID = 'clinic-uuid-0001';
const AUTHOR_ID = 'doctor-uuid-1111';

const makeVisit = (overrides: Partial<Visit> = {}): Visit =>
  Object.assign(new Visit(), {
    id: 'visit-uuid-1111',
    clinic_id: CLINIC_ID,
    patient_id: 'patient-uuid-1111',
    provider_id: AUTHOR_ID,
    appointment_id: null,
    original_visit_date: new Date('2026-10-01T08:00:00Z'),
    status: VisitStatus.FINALIZED,
    current_version: 1,
    created_at: new Date('2026-10-01T08:00:00Z'),
    updated_at: new Date('2026-10-01T08:00:00Z'),
    versions: [],
    ...overrides,
  });

describe('RecordsService — Clinical Record Amendments', () => {
  let service: RecordsService;

  const visitRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const versionRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const measurementRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const diagnosisRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        { provide: getRepositoryToken(Visit), useValue: visitRepoMock },
        { provide: getRepositoryToken(VisitVersion), useValue: versionRepoMock },
        { provide: getRepositoryToken(VisitMeasurement), useValue: measurementRepoMock },
        { provide: getRepositoryToken(VisitDiagnosis), useValue: diagnosisRepoMock },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
    jest.clearAllMocks();
  });

  describe('create — initial visit record', () => {
    it('should create a Visit with version 1', async () => {
      const visit = makeVisit({ current_version: 1, status: VisitStatus.FINALIZED });
      visitRepoMock.create.mockReturnValue(visit);
      visitRepoMock.save.mockResolvedValue(visit);

      const version = Object.assign(new VisitVersion(), {
        id: 'version-1',
        visit_id: visit.id,
        version_number: 1,
        change_reason: 'Initial consultation record',
      });
      versionRepoMock.create.mockReturnValue(version);
      versionRepoMock.save.mockResolvedValue(version);

      // findOne is called by create() after saving
      visitRepoMock.findOne.mockResolvedValue({ ...visit, versions: [version] });

      const result = await service.create(CLINIC_ID, AUTHOR_ID, {
        patientId: 'patient-uuid-1111',
        providerId: AUTHOR_ID,
        chiefComplaint: 'Toothache',
        diagnosis: 'Caries',
        treatmentPlan: 'Fill cavity',
        clinicalNotes: 'Patient anxious',
      });

      expect(visitRepoMock.save).toHaveBeenCalled();
      expect(versionRepoMock.save).toHaveBeenCalled();
      expect(result.current_version).toBe(1);
    });
  });

  describe('amend — medical record amendment', () => {
    it('MANDATORY: should reject amendment when changeReason is empty string', async () => {
      // Note: service throws BadRequestException before querying DB
      await expect(
        service.amend(CLINIC_ID, 'visit-uuid-1111', AUTHOR_ID, {
          diagnosis: 'Updated',
          changeReason: '',
        }),
      ).rejects.toThrow(BadRequestException);

      // Should fail before even hitting the DB
      expect(visitRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('MANDATORY: should reject amendment when changeReason is whitespace only', async () => {
      await expect(
        service.amend(CLINIC_ID, 'visit-uuid-1111', AUTHOR_ID, {
          diagnosis: 'Updated',
          changeReason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should insert a new VisitVersion and increment current_version', async () => {
      const visit = makeVisit({ current_version: 1 });
      const nextVersion = Object.assign(new VisitVersion(), {
        id: 'version-2',
        visit_id: visit.id,
        version_number: 2,
        diagnosis: 'Updated diagnosis',
        change_reason: 'Corrected after X-ray review',
        changed_by: AUTHOR_ID,
      });

      // findOne is called twice: once in amend (via findOne helper), once at the end
      visitRepoMock.findOne
        .mockResolvedValueOnce({ ...visit, versions: [] })   // first call in amend
        .mockResolvedValueOnce({ ...visit, current_version: 2, versions: [nextVersion] }); // return at end

      versionRepoMock.create.mockReturnValue(nextVersion);
      versionRepoMock.save.mockResolvedValue(nextVersion);
      visitRepoMock.save.mockImplementation((v: any) => Promise.resolve(v));

      const result = await service.amend(CLINIC_ID, visit.id, AUTHOR_ID, {
        diagnosis: 'Updated diagnosis',
        changeReason: 'Corrected after X-ray review',
      });

      // Version was saved
      expect(versionRepoMock.save).toHaveBeenCalled();

      // Visit was saved with incremented version and AMENDED status
      expect(visitRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          current_version: 2,
          status: VisitStatus.AMENDED,
        }),
      );
    });

    it('IMMUTABILITY: original_visit_date must not be modified by amendment', async () => {
      const originalDate = new Date('2026-10-01T08:00:00Z');
      const visit = makeVisit({ current_version: 1, original_visit_date: originalDate });
      const nextVersion = Object.assign(new VisitVersion(), { version_number: 2 });

      visitRepoMock.findOne
        .mockResolvedValueOnce({ ...visit, versions: [] })
        .mockResolvedValueOnce({ ...visit, current_version: 2, versions: [nextVersion] });

      versionRepoMock.create.mockReturnValue(nextVersion);
      versionRepoMock.save.mockResolvedValue(nextVersion);
      visitRepoMock.save.mockImplementation((v: any) => Promise.resolve(v));

      await service.amend(CLINIC_ID, visit.id, AUTHOR_ID, {
        diagnosis: 'Amended',
        changeReason: 'Correction',
      });

      const savedVisit = visitRepoMock.save.mock.calls[0][0];
      // original_visit_date must be exactly the same object — not mutated
      expect(new Date(savedVisit.original_visit_date).getTime()).toBe(originalDate.getTime());
    });

    it('IMMUTABILITY: created_at must not be modified by amendment', async () => {
      const originalCreatedAt = new Date('2026-10-01T08:00:00Z');
      const visit = makeVisit({ current_version: 1, created_at: originalCreatedAt });
      const nextVersion = Object.assign(new VisitVersion(), { version_number: 2 });

      visitRepoMock.findOne
        .mockResolvedValueOnce({ ...visit, versions: [] })
        .mockResolvedValueOnce({ ...visit, current_version: 2, versions: [nextVersion] });

      versionRepoMock.create.mockReturnValue(nextVersion);
      versionRepoMock.save.mockResolvedValue(nextVersion);
      visitRepoMock.save.mockImplementation((v: any) => Promise.resolve(v));

      await service.amend(CLINIC_ID, visit.id, AUTHOR_ID, {
        diagnosis: 'Amended',
        changeReason: 'Correction',
      });

      const savedVisit = visitRepoMock.save.mock.calls[0][0];
      expect(new Date(savedVisit.created_at).getTime()).toBe(originalCreatedAt.getTime());
    });

    it('ISOLATION: amend must throw NotFoundException for a visit from another clinic', async () => {
      visitRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.amend('other-clinic-id', 'visit-uuid-1111', AUTHOR_ID, {
          diagnosis: 'Hacked',
          changeReason: 'Unauthorized',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('VERSION CHAIN: second amendment should produce version 3', async () => {
      const visit = makeVisit({ current_version: 2, status: VisitStatus.AMENDED });
      const version3 = Object.assign(new VisitVersion(), { version_number: 3 });

      visitRepoMock.findOne
        .mockResolvedValueOnce({ ...visit, versions: [] })
        .mockResolvedValueOnce({ ...visit, current_version: 3, versions: [version3] });

      versionRepoMock.create.mockReturnValue(version3);
      versionRepoMock.save.mockResolvedValue(version3);
      visitRepoMock.save.mockImplementation((v: any) => Promise.resolve(v));

      await service.amend(CLINIC_ID, visit.id, AUTHOR_ID, {
        diagnosis: 'Third revision',
        changeReason: 'Further correction after consultation',
      });

      expect(visitRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ current_version: 3 }),
      );
    });
  });
});
