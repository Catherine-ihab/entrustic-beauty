import type { SpecialtyModule } from '../types';
import { GYNECOLOGY_CONFIG } from './config';
import { GynecologyWorkspace } from './GynecologyWorkspace';

export const GynecologyModule: SpecialtyModule = {
  config: GYNECOLOGY_CONFIG,
  Workspace: GynecologyWorkspace,
};

export { GynecologyWorkspace, GYNECOLOGY_CONFIG };
