import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AllergiesService } from './allergies.service';
import { ConditionsService } from './conditions.service';
import { SnapshotService } from './snapshot.service';
import { PatientAllergy } from '../patients/entities/patient-allergy.entity';
import { PatientCondition } from '../patients/entities/patient-condition.entity';
import { PatientMedication } from '../patients/entities/patient-medication.entity';

const CLINIC_A_ID = 'clinic-a-uuid-0001';
const CLINIC_B_ID = 'clinic-b-uuid-0002';
const PATIENT_ID = 'patient-uuid-1111';

describe('Medical Records Services — Multi-Tenant Isolation', () => {
  let allergiesService: AllergiesService;
  let conditionsService: ConditionsService;
  let snapshotService: SnapshotService;

  const allergyRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const conditionRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const medicationRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllergiesService,
        ConditionsService,
        SnapshotService,
        {
          provide: getRepositoryToken(PatientAllergy),
          useValue: allergyRepoMock,
        },
        {
          provide: getRepositoryToken(PatientCondition),
          useValue: conditionRepoMock,
        },
        {
          provide: getRepositoryToken(PatientMedication),
          useValue: medicationRepoMock,
        },
      ],
    }).compile();

    allergiesService = module.get<AllergiesService>(AllergiesService);
    conditionsService = module.get<ConditionsService>(ConditionsService);
    snapshotService = module.get<SnapshotService>(SnapshotService);

    jest.clearAllMocks();
  });

  describe('AllergiesService — Tenant Isolation', () => {
    it('findAll scopes query strictly to clinic_id and patient_id', async () => {
      allergyRepoMock.find.mockResolvedValue([]);

      await allergiesService.findAll(CLINIC_A_ID, PATIENT_ID);

      expect(allergyRepoMock.find).toHaveBeenCalledWith({
        where: { clinic_id: CLINIC_A_ID, patient_id: PATIENT_ID },
        order: { created_at: 'DESC' },
      });
    });

    it('update rejects with NotFoundException if allergy belongs to another clinic', async () => {
      allergyRepoMock.findOne.mockResolvedValue(null);

      await expect(
        allergiesService.update(CLINIC_B_ID, PATIENT_ID, 'allergy-1', { allergen: 'Aspirin' }),
      ).rejects.toThrow(NotFoundException);

      expect(allergyRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'allergy-1', clinic_id: CLINIC_B_ID, patient_id: PATIENT_ID },
      });
    });

    it('create sets clinic_id and patient_id firmly on new record', async () => {
      const mockRecord = { id: 'new-allergy' };
      allergyRepoMock.create.mockReturnValue(mockRecord);
      allergyRepoMock.save.mockResolvedValue(mockRecord);

      await allergiesService.create(CLINIC_A_ID, PATIENT_ID, { allergen: 'Penicillin' }, 'user-1');

      expect(allergyRepoMock.create).toHaveBeenCalledWith({
        allergen: 'Penicillin',
        clinic_id: CLINIC_A_ID,
        patient_id: PATIENT_ID,
        created_by: 'user-1',
      });
      expect(allergyRepoMock.save).toHaveBeenCalledWith(mockRecord);
    });
  });

  describe('ConditionsService — Tenant Isolation', () => {
    it('findAll scopes query strictly to clinic_id and patient_id', async () => {
      conditionRepoMock.find.mockResolvedValue([]);

      await conditionsService.findAll(CLINIC_A_ID, PATIENT_ID);

      expect(conditionRepoMock.find).toHaveBeenCalledWith({
        where: { clinic_id: CLINIC_A_ID, patient_id: PATIENT_ID },
        order: { created_at: 'DESC' },
      });
    });

    it('update rejects with NotFoundException when trying to cross tenant boundaries', async () => {
      conditionRepoMock.findOne.mockResolvedValue(null);

      await expect(
        conditionsService.update(CLINIC_A_ID, PATIENT_ID, 'condition-from-clinic-b', { name: 'Asthma' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SnapshotService — Medical Alert Flags', () => {
    it('detects life-threatening allergies correctly in snapshot response', async () => {
      allergyRepoMock.find.mockResolvedValue([
        { id: '1', allergen: 'Penicillin', severity: 'life_threatening', status: 'active' },
      ]);
      conditionRepoMock.find.mockResolvedValue([
        { id: 'c1', name: 'Hypertension', status: 'active' },
      ]);
      medicationRepoMock.find.mockResolvedValue([]);

      const snapshot = await snapshotService.getSnapshot(CLINIC_A_ID, PATIENT_ID);

      expect(snapshot.alerts.hasLifeThreateningAllergy).toBe(true);
      expect(snapshot.alerts.allergyCount).toBe(1);
      expect(snapshot.alerts.conditionCount).toBe(1);
      expect(snapshot.alerts.medicationCount).toBe(0);

      // Verify tenant isolation in all queries
      expect(allergyRepoMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ clinic_id: CLINIC_A_ID }) }),
      );
      expect(conditionRepoMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ clinic_id: CLINIC_A_ID }) }),
      );
      expect(medicationRepoMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ clinic_id: CLINIC_A_ID }) }),
      );
    });
  });
});
