import type { SpecialtyModule } from '../types';
import { GENERAL_MEDICAL_CONFIG } from './config';
import { GeneralMedicalWorkspace } from './GeneralMedicalWorkspace';

export const GeneralMedicalModule: SpecialtyModule = {
  config: GENERAL_MEDICAL_CONFIG,
  Workspace: GeneralMedicalWorkspace,
};

export { GeneralMedicalWorkspace, GENERAL_MEDICAL_CONFIG };
