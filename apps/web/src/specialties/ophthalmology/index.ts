import type { SpecialtyModule } from '../types';
import { OPHTHALMOLOGY_CONFIG } from './config';
import { OphthalmologyWorkspace } from './OphthalmologyWorkspace';
import { EyeAnatomy3D } from './EyeAnatomy3D';
import { RetinalFundus2D } from './RetinalFundus2D';

export const OphthalmologyModule: SpecialtyModule = {
  config: OPHTHALMOLOGY_CONFIG,
  Workspace: OphthalmologyWorkspace,
  Visualizer2D: RetinalFundus2D,
  Visualizer3D: EyeAnatomy3D,
};

export { OphthalmologyWorkspace, EyeAnatomy3D, RetinalFundus2D, OPHTHALMOLOGY_CONFIG };
