import { HeartPulse } from 'lucide-react';
import { BasicWorkspace } from '../BasicWorkspace';
import { GYNECOLOGY_CONFIG } from './config';
import type { SpecialtyComponentProps } from '../types';

export function GynecologyWorkspace({ readonly }: SpecialtyComponentProps) {
  return <BasicWorkspace config={GYNECOLOGY_CONFIG} readonly={readonly} icon={<HeartPulse size={16} />} />;
}
