import { Baby } from 'lucide-react';
import { BasicWorkspace } from '../BasicWorkspace';
import { PEDIATRICS_CONFIG } from './config';
import type { SpecialtyComponentProps } from '../types';

export function PediatricsWorkspace({ readonly }: SpecialtyComponentProps) {
  return <BasicWorkspace config={PEDIATRICS_CONFIG} readonly={readonly} icon={<Baby size={16} />} />;
}
