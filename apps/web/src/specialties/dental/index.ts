import type { SpecialtyModule } from '../types';
import { DENTAL_CONFIG } from './config';
import { DentalWorkspace } from './DentalWorkspace';
import { DentalJaw3D } from './DentalJaw3D';
import { DentalOdontogram2D } from './DentalOdontogram2D';

export const DentalModule: SpecialtyModule = {
  config: DENTAL_CONFIG,
  Workspace: DentalWorkspace,
  Visualizer2D: DentalOdontogram2D,
  Visualizer3D: DentalJaw3D,
};

export { DentalWorkspace, DentalJaw3D, DentalOdontogram2D, DENTAL_CONFIG };
