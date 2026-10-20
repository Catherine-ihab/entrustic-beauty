import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const OPHTHALMOLOGY_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.OPHTHALMOLOGY,
  nameEn: 'Ophthalmology & Eye Surgery',
  nameAr: 'طب وجراحة العيون',
  taglineEn: 'Refractive Surgery, Cornea, Glaucoma Management & Vitreoretinal Care',
  taglineAr: 'تصحيح الإبصار، جراحات القرنية، المياه البيضاء، والمياه الزرقاء والشبكية',
  icon: 'Eye',
  themeColor: '#2563eb',
  has3DVisualizer: true,
  has2DVisualizer: true,
  measurements: [
    { key: 'iop_goldmann_od', label: 'IOP Goldmann (OD)', unit: 'mmHg', type: 'number', defaultValue: 16 },
    { key: 'iop_goldmann_os', label: 'IOP Goldmann (OS)', unit: 'mmHg', type: 'number', defaultValue: 15 },
    { key: 'cup_to_disc_ratio', label: 'Cup-to-Disc Ratio (C/D)', unit: 'ratio', type: 'number', defaultValue: 0.3 },
    { key: 'corneal_pachymetry', label: 'Central Corneal Thickness', unit: 'µm', type: 'number', defaultValue: 540 },
  ],
  quickTemplates: [
    {
      category: 'Glaucoma',
      name: 'Primary Open-Angle Glaucoma (POAG) Workup',
      chiefComplaint: 'Routine checkup, positive family history of glaucoma',
      diagnosis: 'POAG bilateral, IOP OD 24 mmHg / OS 22 mmHg, C/D ratio 0.6 OD',
      plan: 'Initiate Latanoprost 0.005% 1 drop each eye at bedtime. Schedule Humphrey visual field 24-2 and OCT retinal nerve fiber layer (RNFL).',
    },
    {
      category: 'Cataract',
      name: 'Senile Nuclear Sclerotic Cataract',
      chiefComplaint: 'Gradual painless progressive blurring of vision, glare while night driving',
      diagnosis: 'Nuclear sclerotic cataract Grade II OD / Grade I OS',
      plan: 'Biometry IOL calculation done. Scheduled for clear corneal phacoemulsification with hydrophobic monofocal IOL implantation under topical anesthesia.',
    },
  ],
};
