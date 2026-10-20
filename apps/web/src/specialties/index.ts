import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModule } from './types';

import { DentalModule } from './dental';
import { DermaAestheticModule } from './dermatology_aesthetic';
import { PhysioOrthoModule } from './physiotherapy_orthopedic';
import { OphthalmologyModule } from './ophthalmology';
import { ENTModule } from './ent';
import { NutritionModule } from './nutrition';
import { PsychologyModule } from './psychology';
import { GeneralMedicalModule } from './general_medical';
import { PediatricsModule } from './pediatrics';
import { GynecologyModule } from './gynecology';
import { SPECIALTY_LOCK } from './lock';

const SPECIALTY_REGISTRY: Partial<Record<ClinicType, SpecialtyModule>> = {
  [ClinicType.GENERAL_MEDICAL]: GeneralMedicalModule,
  [ClinicType.DENTAL]: DentalModule,
  [ClinicType.DERMATOLOGY]: DermaAestheticModule,
  [ClinicType.PHYSIOTHERAPY]: PhysioOrthoModule,
  [ClinicType.REHABILITATION]: PhysioOrthoModule,
  [ClinicType.NUTRITION]: NutritionModule,
  [ClinicType.PSYCHOLOGY]: PsychologyModule,
  [ClinicType.ORTHOPEDIC]: PhysioOrthoModule,
  [ClinicType.OPHTHALMOLOGY]: OphthalmologyModule,
  [ClinicType.ENT]: ENTModule,
  [ClinicType.PEDIATRICS]: PediatricsModule,
  [ClinicType.GYNECOLOGY]: GynecologyModule,
  [ClinicType.AESTHETIC]: DermaAestheticModule,
  [ClinicType.OTHER]: GeneralMedicalModule,
  [ClinicType.CUSTOM]: GeneralMedicalModule,
};

export function getSpecialtyModule(clinicType?: ClinicType): SpecialtyModule | null {
  // Single-specialty build → always resolve the locked specialty.
  const key = SPECIALTY_LOCK ?? clinicType;
  if (!key) return null;
  return SPECIALTY_REGISTRY[key] ?? null;
}

export {
  SPECIALTY_REGISTRY,
  SPECIALTY_LOCK,
  DentalModule,
  DermaAestheticModule,
  PhysioOrthoModule,
  OphthalmologyModule,
  ENTModule,
  NutritionModule,
  PsychologyModule,
  GeneralMedicalModule,
  PediatricsModule,
  GynecologyModule,
};

export type { SpecialtyModule };
