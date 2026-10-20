import type { SpecialtyModule } from '../types';
import { NUTRITION_CONFIG } from './config';
import { NutritionWorkspace } from './NutritionWorkspace';
import { NutritionPanel } from './NutritionPanel';

export const NutritionModule: SpecialtyModule = {
  config: NUTRITION_CONFIG,
  Workspace: NutritionWorkspace,
  Visualizer2D: NutritionPanel,
};

export { NutritionWorkspace, NutritionPanel, NUTRITION_CONFIG };
