import type { FC } from 'react';
import { ClinicType } from '@clinic/shared-types';

export interface SpecialtyMeasurementDef {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'text' | 'select';
  options?: string[];
  defaultValue?: any;
}

export interface SpecialtyTemplate {
  category: string;
  name: string;
  chiefComplaint?: string;
  diagnosis?: string;
  plan?: string;
}

export interface SpecialtyModuleConfig {
  id: ClinicType;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  icon: string;
  themeColor: string;
  measurements: SpecialtyMeasurementDef[];
  quickTemplates: SpecialtyTemplate[];
  has3DVisualizer: boolean;
  has2DVisualizer: boolean;
}

export interface SpecialtyComponentProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
  onStateChange?: (state: any) => void;
}

export interface SpecialtyModule {
  config: SpecialtyModuleConfig;
  Workspace: FC<SpecialtyComponentProps>;
  Visualizer2D?: FC<SpecialtyComponentProps>;
  Visualizer3D?: FC<SpecialtyComponentProps>;
}
