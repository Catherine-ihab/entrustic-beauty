import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const PHYSIO_ORTHO_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.PHYSIOTHERAPY,
  nameEn: 'Physiotherapy & Orthopedic Rehabilitation',
  nameAr: 'العلاج الطبيعي والتأهيل العظمي',
  taglineEn: 'Musculoskeletal Biomechanics, Sports Injuries, Joint Mobilization & Functional Rehab',
  taglineAr: 'إعادة التأهيل الحركي، إصابات الملاعب، وتأهيل المفاصل والعمود الفقري',
  icon: 'Activity',
  themeColor: '#059669',
  has3DVisualizer: true,
  has2DVisualizer: true,
  measurements: [
    { key: 'vas_pain_score', label: 'VAS Pain Score (0-10)', unit: 'VAS', type: 'number', defaultValue: 5 },
    { key: 'rom_flexion_deficit', label: 'Primary ROM Deficit', unit: 'deg', type: 'number', defaultValue: 30 },
    { key: 'mrc_strength_grade', label: 'MRC Muscle Strength Grade', unit: 'grade', type: 'select', options: ['0 (No contraction)', '1 (Trace)', '2 (Gravity eliminated)', '3 (Against gravity)', '4 (Against resistance)', '5 (Normal)'] },
    { key: 'functional_oswestry_index', label: 'Oswestry / DASH Disability Score', unit: '%', type: 'number', defaultValue: 35 },
  ],
  quickTemplates: [
    {
      category: 'Spine',
      name: 'Lumbar Radiculopathy / Disc Herniation',
      chiefComplaint: 'Low back pain radiating to left gluteal and posterolateral calf with paresthesia',
      diagnosis: 'L5-S1 disc protrusion with S1 nerve root irritation (positive SLR 45°)',
      plan: 'Maitland grade II-III central lumbar mobilization, directional preference McKenzie extension exercises, core stabilization (transversus abdominis), pelvic traction.',
    },
    {
      category: 'Sports Rehabilitation',
      name: 'Post-Op ACL Reconstruction Rehabilitation',
      chiefComplaint: '6 weeks post-ACL bone-patellar tendon-bone autograft, quadriceps inhibition',
      diagnosis: 'Postoperative anterior cruciate ligament reconstruction (Week 6 Phase II)',
      plan: 'Terminal knee extension (TKE), closed kinetic chain squats (0-60°), neuromuscular electrical stimulation (NMES) for VMO, stationary cycling.',
    },
  ],
};
