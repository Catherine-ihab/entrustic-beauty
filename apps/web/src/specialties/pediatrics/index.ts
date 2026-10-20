import type { SpecialtyModule } from '../types';
import { PEDIATRICS_CONFIG } from './config';
import { PediatricsWorkspace } from './PediatricsWorkspace';

export const PediatricsModule: SpecialtyModule = {
  config: PEDIATRICS_CONFIG,
  Workspace: PediatricsWorkspace,
};

export { PediatricsWorkspace, PEDIATRICS_CONFIG };
