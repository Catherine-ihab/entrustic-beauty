import type { SpecialtyModule } from '../types';
import { ENT_CONFIG } from './config';
import { ENTWorkspace } from './ENTWorkspace';
import { ENTPanel } from './ENTPanel';

export const ENTModule: SpecialtyModule = {
  config: ENT_CONFIG,
  Workspace: ENTWorkspace,
  Visualizer2D: ENTPanel,
};

export { ENTWorkspace, ENTPanel, ENT_CONFIG };
