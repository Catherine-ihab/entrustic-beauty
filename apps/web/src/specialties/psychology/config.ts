import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const PSYCHOLOGY_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.PSYCHOLOGY,
  nameEn: 'Psychiatry & Clinical Psychology',
  nameAr: 'الطب النفسي وعلم النفس الإكلينيكي',
  taglineEn: 'Psychometric Assessments, Cognitive Behavioral Protocols, MSE & Safety Formulations',
  taglineAr: 'المقاييس النفسية، العلاج السلوكي المعرفي، فحص الحالة العقلية، وخطط الأمان النفسي',
  icon: 'Brain',
  themeColor: '#8b5cf6',
  has3DVisualizer: false,
  has2DVisualizer: true,
  measurements: [
    { key: 'phq9_depression_score', label: 'PHQ-9 Depression Score (0-27)', unit: 'pts', type: 'number', defaultValue: 6 },
    { key: 'gad7_anxiety_score', label: 'GAD-7 Anxiety Score (0-21)', unit: 'pts', type: 'number', defaultValue: 5 },
    { key: 'suicide_risk_stratification', label: 'Suicide Risk Tier', unit: 'tier', type: 'select', options: ['Low Risk', 'Moderate Risk', 'High Risk', 'Imminent Emergency'] },
  ],
  quickTemplates: [
    {
      category: 'Affective Disorders',
      name: 'Major Depressive Episode Evaluation',
      chiefComplaint: 'Depressed mood, anhedonia, sleep fragmentation, impaired executive concentration',
      diagnosis: 'Major Depressive Disorder, single episode, moderate severity (PHQ-9: 14)',
      plan: 'Psychoeducation on neurobiology of depression, initiate SSRI pharmacotherapy, bi-weekly CBT focusing on behavioral activation.',
    },
    {
      category: 'Anxiety Disorders',
      name: 'Panic Disorder & Agoraphobia Formulation',
      chiefComplaint: 'Sudden unprovoked palpitations, shortness of breath, fear of impending doom in public',
      diagnosis: 'Panic Disorder with moderate agoraphobia (GAD-7: 16)',
      plan: 'Interoceptive exposure hierarchy, diaphragmatic breath retargeting, cognitive restructuring of catastrophic misinterpretations.',
    },
  ],
};
