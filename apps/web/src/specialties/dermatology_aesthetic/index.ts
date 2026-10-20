import type { SpecialtyModule } from '../types';
import { DERMA_AESTHETIC_CONFIG } from './config';
import { DermaAestheticWorkspace } from './DermaAestheticWorkspace';
import { AestheticFace3D } from './AestheticFace3D';
import { BodyAndFaceMap2D } from './BodyAndFaceMap2D';

export const DermaAestheticModule: SpecialtyModule = {
  config: DERMA_AESTHETIC_CONFIG,
  Workspace: DermaAestheticWorkspace,
  Visualizer2D: BodyAndFaceMap2D,
  Visualizer3D: AestheticFace3D,
};

export { DermaAestheticWorkspace, AestheticFace3D, BodyAndFaceMap2D, DERMA_AESTHETIC_CONFIG };
