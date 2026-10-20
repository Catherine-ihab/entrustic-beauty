import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const GENERAL_MEDICAL_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.GENERAL_MEDICAL,
  nameEn: 'General Medicine',
  nameAr: 'الطب العام',
  taglineEn: 'Primary Care, Chronic Disease Follow-up & Whole-System Assessment',
  taglineAr: 'الرعاية الأولية ومتابعة الأمراض المزمنة والفحص الشامل',
  icon: 'Stethoscope',
  themeColor: '#2563EB',
  has3DVisualizer: false,
  has2DVisualizer: false,
  measurements: [
    { key: 'body_temperature', label: 'Body Temperature', unit: '°C', type: 'number', defaultValue: 37 },
    { key: 'blood_pressure', label: 'Blood Pressure (Sys/Dia)', unit: 'mmHg', type: 'text' },
    { key: 'pulse_rate', label: 'Pulse Rate', unit: 'bpm', type: 'number', defaultValue: 78 },
    { key: 'blood_sugar', label: 'Fasting Blood Glucose', unit: 'mg/dL', type: 'number' },
  ],
  quickTemplates: [
    {
      category: 'Acute',
      name: 'Upper Respiratory Infection',
      chiefComplaint: 'Sore throat, nasal congestion and low-grade fever for 3 days',
      diagnosis: 'Acute viral upper respiratory infection (J06.9)',
      plan: 'Supportive care, hydration, antipyretics as needed; return if fever persists beyond 5 days or worsens.',
    },
    {
      category: 'Chronic Care',
      name: 'Hypertension Follow-Up',
      chiefComplaint: 'Routine blood pressure review, no new symptoms',
      diagnosis: 'Essential hypertension, controlled (I10)',
      plan: 'Continue current antihypertensive, home BP log twice daily, low-sodium diet, review labs in 4 weeks.',
    },
  ],
};
