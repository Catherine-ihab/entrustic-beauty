import type { SpecialtyModule } from '../types';
import { PSYCHOLOGY_CONFIG } from './config';
import { PsychologyWorkspace } from './PsychologyWorkspace';
import { PsychologyPanel } from './PsychologyPanel';

export const PsychologyModule: SpecialtyModule = {
  config: PSYCHOLOGY_CONFIG,
  Workspace: PsychologyWorkspace,
  Visualizer2D: PsychologyPanel,
};

export { PsychologyWorkspace, PsychologyPanel, PSYCHOLOGY_CONFIG };
