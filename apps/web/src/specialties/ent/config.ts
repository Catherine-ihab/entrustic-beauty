import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const ENT_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.ENT,
  nameEn: 'Otolaryngology (ENT)',
  nameAr: 'طب الأنف والأذن والحنجرة',
  taglineEn: 'Otology, Rhinology, Laryngology, Head & Neck Surgery',
  taglineAr: 'جراحة وأمراض الأذن، الأنف، الجيوب الأنفية، والحنجرة والأحبال الصوتية',
  icon: 'Ear',
  themeColor: '#6D28D9',
  has3DVisualizer: false,
  has2DVisualizer: true,
  measurements: [
    { key: 'pure_tone_average_right', label: 'PTA Right Ear (500-2k)', unit: 'dB', type: 'number', defaultValue: 15 },
    { key: 'pure_tone_average_left', label: 'PTA Left Ear (500-2k)', unit: 'dB', type: 'number', defaultValue: 15 },
    { key: 'tympanometry_type', label: 'Tympanometry Curve', unit: 'Type', type: 'select', options: ['Type A (Normal)', 'Type B (Fluid/Perforation)', 'Type C (Negative Pressure)'] },
  ],
  quickTemplates: [
    {
      category: 'Otology',
      name: 'Otitis Media with Effusion (OME)',
      chiefComplaint: 'Bilateral ear fullness, decreased hearing, autophony',
      diagnosis: 'Otitis media with effusion bilateral, retracted TM with amber fluid level',
      plan: 'Nasal corticosteroid spray (Mometasone), Valsalva autoinflation, follow-up PTA & tympanometry in 4 weeks. Discuss myringotomy with grommet if persistent.',
    },
    {
      category: 'Rhinology',
      name: 'Chronic Allergic Rhinosinusitis',
      chiefComplaint: 'Chronic nasal obstruction, hyposmia, post-nasal drip',
      diagnosis: 'Allergic rhinitis with bilateral inferior turbinate hypertrophy',
      plan: 'High-volume isotonic saline nasal rinse, intranasal antihistamine/steroid combination, consider radiofrequency turbinate reduction.',
    },
  ],
};
