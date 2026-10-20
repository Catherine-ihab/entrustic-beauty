import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const NUTRITION_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.NUTRITION,
  nameEn: 'Clinical Nutrition & Dietetics',
  nameAr: 'التغذية العلاجية والحميات الغذائية',
  taglineEn: 'Metabolic Profiling, BMR/TDEE Calculation, Macro Optimization & Medical Nutrition Therapy',
  taglineAr: 'حساب السعرات، توزيع المغذيات، علاج السمنة والنحافة، وتغذية الأمراض المزمنة',
  icon: 'Apple',
  themeColor: '#10b981',
  has3DVisualizer: false,
  has2DVisualizer: true,
  measurements: [
    { key: 'body_mass_index', label: 'Body Mass Index (BMI)', unit: 'kg/m²', type: 'number', defaultValue: 24.5 },
    { key: 'basal_metabolic_rate', label: 'Basal Metabolic Rate (BMR)', unit: 'kcal', type: 'number', defaultValue: 1650 },
    { key: 'body_fat_percentage', label: 'Body Fat % (InBody)', unit: '%', type: 'number', defaultValue: 22 },
    { key: 'visceral_fat_level', label: 'Visceral Fat Level', unit: 'level', type: 'number', defaultValue: 6 },
  ],
  quickTemplates: [
    {
      category: 'Metabolic',
      name: 'Type 2 Diabetes Medical Nutrition Therapy',
      chiefComplaint: 'Uncontrolled HbA1c (8.2%), elevated postprandial blood glucose',
      diagnosis: 'Type 2 Diabetes Mellitus with secondary overweight (BMI 29.2)',
      plan: 'Low glycemic index protocol, carbohydrate budget 45g/meal, soluble fiber 35g/day, eliminate sugar-sweetened beverages.',
    },
    {
      category: 'Weight Management',
      name: 'Caloric Deficit & High-Protein Satiety Plan',
      chiefComplaint: 'Difficulty sustaining weight loss, afternoon cravings',
      diagnosis: 'Class I Obesity (BMI 31.4)',
      plan: '500 kcal daily deficit from TDEE, protein intake targeted at 1.6g/kg lean body mass, hydration 3L/day, 10,000 steps daily.',
    },
  ],
};
