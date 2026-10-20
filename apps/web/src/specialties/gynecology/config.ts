import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const GYNECOLOGY_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.GYNECOLOGY,
  nameEn: 'Gynecology & Women\'s Health',
  nameAr: 'النساء والتوليد',
  taglineEn: 'Antenatal Care, Menstrual & Fertility Reviews, Screening & Family Planning',
  taglineAr: 'متابعة الحمل، اضطرابات الدورة والخصوبة، الفحوصات الوقائية وتنظيم الأسرة',
  icon: 'HeartPulse',
  themeColor: '#E11D48',
  has3DVisualizer: false,
  has2DVisualizer: false,
  measurements: [
    { key: 'lmp_date', label: 'Last Menstrual Period', unit: 'YYYY-MM-DD', type: 'text' },
    { key: 'gestational_age', label: 'Gestational Age', unit: 'weeks', type: 'number' },
    { key: 'blood_pressure', label: 'Blood Pressure (Sys/Dia)', unit: 'mmHg', type: 'text' },
    {
      key: 'risk_category',
      label: 'Pregnancy Risk Category',
      unit: 'tier',
      type: 'select',
      options: ['Low Risk', 'Moderate Risk', 'High Risk'],
    },
  ],
  quickTemplates: [
    {
      category: 'Antenatal',
      name: 'Routine Antenatal Visit',
      chiefComplaint: 'Routine pregnancy follow-up, no labor signs',
      diagnosis: 'Singleton intrauterine pregnancy, low risk (Z34.9)',
      plan: 'Fundal height & fetal heart rate check, BP/urine protein screening, iron-folic acid continued, next visit in 4 weeks.',
    },
    {
      category: 'Gynecology',
      name: 'Menstrual Disorder Evaluation',
      chiefComplaint: 'Irregular cycles with heavy flow for 3 months',
      diagnosis: 'Abnormal uterine bleeding, not elsewhere classified (N93.9)',
      plan: 'CBC & pelvic ultrasound, rule out fibroids/endometrial pathology, cycle regulation counseling, follow-up in 2 weeks.',
    },
  ],
};
