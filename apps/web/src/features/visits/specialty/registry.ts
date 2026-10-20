import type { FC } from 'react';
import { ClinicType } from '@clinic/shared-types';
import { GenericPanel } from './GenericPanel';
import { getSpecialtyModule } from '../../../specialties';


export interface SpecialtyPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

export function getSpecialtyPanel(clinicType?: ClinicType): FC<SpecialtyPanelProps> {
  if (!clinicType) return GenericPanel;
  const mod = getSpecialtyModule(clinicType);
  if (mod && mod.Workspace) {
    return mod.Workspace as FC<SpecialtyPanelProps>;
  }
  return GenericPanel;
}

export { GenericPanel };
