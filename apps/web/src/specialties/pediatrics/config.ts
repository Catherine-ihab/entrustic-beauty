import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const PEDIATRICS_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.PEDIATRICS,
  nameEn: 'Pediatrics',
  nameAr: 'طب الأطفال',
  taglineEn: 'Growth Charts, Developmental Milestones, Vaccinations & Well-Child Care',
  taglineAr: 'منحنيات النمو، مراحل التطوير، التطعيمات ورعاية الطفل الصحية',
  icon: 'Baby',
  themeColor: '#F59E0B',
  has3DVisualizer: false,
  has2DVisualizer: false,
  measurements: [
    { key: 'weight_percentile', label: 'Weight-for-Age Percentile', unit: '%', type: 'number' },
    { key: 'height_percentile', label: 'Height-for-Age Percentile', unit: '%', type: 'number' },
    { key: 'head_circumference', label: 'Head Circumference', unit: 'cm', type: 'number' },
    {
      key: 'developmental_screen',
      label: 'Developmental Milestone Screen',
      unit: 'result',
      type: 'select',
      options: ['Age-appropriate', 'Mild delay — monitor', 'Significant delay — refer'],
    },
  ],
  quickTemplates: [
    {
      category: 'Well-Child',
      name: 'Routine Well-Child Checkup',
      chiefComplaint: 'Routine health supervision visit, no acute complaints',
      diagnosis: 'Healthy child, normal growth parameters for age',
      plan: 'Plot growth percentiles, review developmental milestones, update immunizations, anticipate-guidance counseling for parents.',
    },
    {
      category: 'Acute',
      name: 'Fever & Irritability Assessment',
      chiefComplaint: 'Fever, irritability and reduced oral intake for 2 days',
      diagnosis: 'Acute febrile illness, likely viral (R50.9)',
      plan: 'Antipyretics, oral rehydration, danger-sign counseling, CBC/CRP if fever persists > 72h, review in 48 hours.',
    },
  ],
};
