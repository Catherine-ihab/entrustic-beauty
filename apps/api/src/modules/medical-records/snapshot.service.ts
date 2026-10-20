import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientAllergy } from '../patients/entities/patient-allergy.entity';
import { PatientCondition } from '../patients/entities/patient-condition.entity';
import { PatientMedication } from '../patients/entities/patient-medication.entity';

@Injectable()
export class SnapshotService {
  constructor(
    @InjectRepository(PatientAllergy) private allergyRepo: Repository<PatientAllergy>,
    @InjectRepository(PatientCondition) private conditionRepo: Repository<PatientCondition>,
    @InjectRepository(PatientMedication) private medicationRepo: Repository<PatientMedication>,
  ) {}

  async getSnapshot(clinicId: string, patientId: string) {
    const [allergies, conditions, medications] = await Promise.all([
      this.allergyRepo.find({ where: { clinic_id: clinicId, patient_id: patientId, status: 'active' }, order: { severity: 'DESC' as any, created_at: 'DESC' } }),
      this.conditionRepo.find({ where: { clinic_id: clinicId, patient_id: patientId, status: 'active' }, order: { severity: 'DESC' as any, created_at: 'DESC' } }),
      this.medicationRepo.find({ where: { clinic_id: clinicId, patient_id: patientId, is_current: true }, order: { created_at: 'DESC' } }),
    ]);

    const hasLifeThreatening = allergies.some(a => a.severity === 'life_threatening');
    const hasSevere = allergies.some(a => a.severity === 'severe');

    return {
      allergies,
      conditions,
      currentMedications: medications,
      alerts: {
        hasLifeThreateningAllergy: hasLifeThreatening,
        hasSevereAllergy: hasSevere,
        allergyCount: allergies.length,
        conditionCount: conditions.length,
        medicationCount: medications.length,
      },
    };
  }
}
