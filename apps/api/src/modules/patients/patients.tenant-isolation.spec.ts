import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { TenantSequence } from '../tenants/entities/tenant-sequence.entity';
import { DataSource } from 'typeorm';
import { Gender, PatientStatus } from '@clinic/shared-types';

const CLINIC_A_ID = 'clinic-a-uuid-0001';
const CLINIC_B_ID = 'clinic-b-uuid-0002';

const makePatient = (overrides: Partial<Patient> = {}): Patient =>
  Object.assign(new Patient(), {
    id: 'patient-uuid-1111',
    clinic_id: CLINIC_A_ID,
    patient_number: 'PAT-00001',
    first_name: 'Omar',
    last_name: 'Hassan',
    gender: Gender.MALE,
    status: PatientStatus.ACTIVE,
    phone: '+201001234567',
    email: null,
    address: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    blood_type: null,
    allergies: null,
    notes: null,
    date_of_birth: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  });

// Mock QueryRunner for generatePatientNumber
const makeQrMock = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((_entity: any, data: any) => ({ ...data })),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
  },
});

describe('PatientsService — Multi-Tenant Isolation', () => {
  let service: PatientsService;
  let qrMock: ReturnType<typeof makeQrMock>;

  const patientRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    softRemove: jest.fn(),
  };

  const dataSourceMock = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    qrMock = makeQrMock();
    dataSourceMock.createQueryRunner.mockReturnValue(qrMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: patientRepoMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    jest.clearAllMocks();
    dataSourceMock.createQueryRunner.mockReturnValue(qrMock);
  });

  describe('findOne — tenant isolation enforcement', () => {
    it('should return a patient that belongs to the requesting clinic', async () => {
      const patient = makePatient({ clinic_id: CLINIC_A_ID });
      patientRepoMock.findOne.mockResolvedValue(patient);

      const result = await service.findOne(CLINIC_A_ID, patient.id);

      expect(patientRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: patient.id, clinic_id: CLINIC_A_ID },
      });
      expect(result.id).toBe(patient.id);
    });

    it('SECURITY: Clinic B must receive NotFoundException when querying Clinic A patient by ID', async () => {
      // Backend enforces clinic_id in WHERE → DB returns nothing → 404
      patientRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(CLINIC_B_ID, 'patient-uuid-1111'),
      ).rejects.toThrow(NotFoundException);

      // The clinic_id of the REQUESTING tenant must be in the WHERE clause
      expect(patientRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'patient-uuid-1111', clinic_id: CLINIC_B_ID },
      });
    });
  });

  describe('update — tenant isolation enforcement', () => {
    it('SECURITY: update must scope lookup to requesting clinic before applying changes', async () => {
      patientRepoMock.findOne.mockResolvedValue(null); // Clinic B patient not visible from Clinic A

      await expect(
        service.update(CLINIC_A_ID, 'patient-from-clinic-b', { firstName: 'Hacked' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully update a patient within the correct tenant context', async () => {
      const patient = makePatient({ clinic_id: CLINIC_A_ID });
      patientRepoMock.findOne.mockResolvedValue(patient);
      patientRepoMock.save.mockResolvedValue({ ...patient, first_name: 'Updated' });

      await service.update(CLINIC_A_ID, patient.id, { firstName: 'Updated' } as any);
      expect(patientRepoMock.save).toHaveBeenCalled();
    });
  });

  describe('remove — tenant isolation enforcement', () => {
    it('SECURITY: cannot soft-delete a patient from another clinic', async () => {
      patientRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.remove(CLINIC_B_ID, 'patient-from-clinic-a'),
      ).rejects.toThrow(NotFoundException);

      expect(patientRepoMock.softRemove).not.toHaveBeenCalled();
    });

    it('should soft-delete a patient that belongs to the clinic', async () => {
      const patient = makePatient();
      patientRepoMock.findOne.mockResolvedValue(patient);
      patientRepoMock.softRemove.mockResolvedValue(patient);

      const result = await service.remove(CLINIC_A_ID, patient.id);
      expect(result).toEqual({ deleted: true });
    });
  });
});
