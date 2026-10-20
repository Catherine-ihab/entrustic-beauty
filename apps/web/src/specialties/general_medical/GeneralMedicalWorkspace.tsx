import { Stethoscope } from 'lucide-react';
import { BasicWorkspace } from '../BasicWorkspace';
import { GENERAL_MEDICAL_CONFIG } from './config';
import type { SpecialtyComponentProps } from '../types';

export function GeneralMedicalWorkspace({ readonly }: SpecialtyComponentProps) {
  return <BasicWorkspace config={GENERAL_MEDICAL_CONFIG} readonly={readonly} icon={<Stethoscope size={16} />} />;
}
