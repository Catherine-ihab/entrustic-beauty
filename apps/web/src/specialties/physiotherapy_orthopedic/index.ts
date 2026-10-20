import type { SpecialtyModule } from '../types';
import { PHYSIO_ORTHO_CONFIG } from './config';
import { PhysioOrthoWorkspace } from './PhysioOrthoWorkspace';
import { HumanSkeleton3D } from './HumanSkeleton3D';
import { JointRom2D } from './JointRom2D';

export const PhysioOrthoModule: SpecialtyModule = {
  config: PHYSIO_ORTHO_CONFIG,
  Workspace: PhysioOrthoWorkspace,
  Visualizer2D: JointRom2D,
  Visualizer3D: HumanSkeleton3D,
};

export { PhysioOrthoWorkspace, HumanSkeleton3D, JointRom2D, PHYSIO_ORTHO_CONFIG };
