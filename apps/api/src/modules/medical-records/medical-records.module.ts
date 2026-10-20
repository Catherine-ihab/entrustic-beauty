import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientCondition } from '../patients/entities/patient-condition.entity';
import { PatientAllergy } from '../patients/entities/patient-allergy.entity';
import { PatientMedication } from '../patients/entities/patient-medication.entity';
import { FamilyHistory } from '../patients/entities/family-history.entity';
import { PatientFile } from '../patients/entities/patient-file.entity';
import { ConsentRecord } from '../patients/entities/consent-record.entity';
import { Patient } from '../patients/entities/patient.entity';
import { VisitMeasurement } from '../records/entities/visit-measurement.entity';
import { VisitDiagnosis } from '../records/entities/visit-diagnosis.entity';
import { Visit } from '../records/entities/visit.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { ConditionsService } from './conditions.service';
import { AllergiesService } from './allergies.service';
import { MedicationsService } from './medications.service';
import { FamilyHistoryService } from './family-history.service';
import { PatientFilesService } from './patient-files.service';
import { ConsentService } from './consent.service';
import { MeasurementsService } from './measurements.service';
import { DiagnosesService } from './diagnoses.service';
import { SnapshotService } from './snapshot.service';
import { TimelineService } from './timeline.service';
import { MedicalRecordsController } from './medical-records.controller';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientCondition,
      PatientAllergy,
      PatientMedication,
      FamilyHistory,
      PatientFile,
      ConsentRecord,
      Patient,
      VisitMeasurement,
      VisitDiagnosis,
      Visit,
      Invoice,
    ]),
    ClsModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [
    ConditionsService,
    AllergiesService,
    MedicationsService,
    FamilyHistoryService,
    PatientFilesService,
    ConsentService,
    MeasurementsService,
    DiagnosesService,
    SnapshotService,
    TimelineService,
  ],
  exports: [
    ConditionsService,
    AllergiesService,
    MedicationsService,
    FamilyHistoryService,
    PatientFilesService,
    ConsentService,
    MeasurementsService,
    DiagnosesService,
    SnapshotService,
    TimelineService,
    TypeOrmModule,
  ],
})
export class MedicalRecordsModule {}
