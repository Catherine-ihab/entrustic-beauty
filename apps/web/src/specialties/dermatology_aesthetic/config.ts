import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const DERMA_AESTHETIC_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.AESTHETIC,
  nameEn: 'Dermatology & Aesthetic Medicine',
  nameAr: 'الجلدية، الليزر والطب التجميلي',
  taglineEn: 'Cutaneous Pathology, Laser Therapeutics, Facial Injections & Cosmeceuticals',
  taglineAr: 'علاج الأمراض الجلدية، جلسات الليزر، وحقن الفيلر والبوتوكس التجميلي',
  icon: 'Sparkles',
  themeColor: '#ec4899',
  has3DVisualizer: true,
  has2DVisualizer: true,
  measurements: [
    { key: 'fitzpatrick_skin_type', label: 'Fitzpatrick Skin Phototype', unit: 'Type', type: 'select', options: ['Type I (Pale)', 'Type II (Fair)', 'Type III (Medium)', 'Type IV (Olive)', 'Type V (Brown)', 'Type VI (Dark)'] },
    { key: 'glogau_photoaging', label: 'Glogau Photoaging Scale', unit: 'Scale', type: 'select', options: ['Type I (No wrinkles)', 'Type II (Wrinkles in motion)', 'Type III (Wrinkles at rest)', 'Type IV (Only wrinkles)'] },
    { key: 'total_botox_units', label: 'Total Neurotoxin Injected', unit: 'Units', type: 'number', defaultValue: 0 },
    { key: 'total_filler_volume', label: 'Total HA Filler Volume', unit: 'mL', type: 'number', defaultValue: 0 },
  ],
  quickTemplates: [
    {
      category: 'Injectables',
      name: 'Upper Face Full Harmonization',
      chiefComplaint: 'Dynamic forehead lines, glabella frown expression and crow’s feet',
      diagnosis: 'Dynamic upper facial rhytids (Glogau II)',
      plan: 'Reconstituted OnabotulinumtoxinA: 20U Glabella, 10U Frontalis, 12U bilateral lateral canthal lines. Post-care instructions given.',
    },
    {
      category: 'Dermatology',
      name: 'Acne Vulgaris Management',
      chiefComplaint: 'Inflammatory papules and pustules on cheeks and jawline',
      diagnosis: 'Moderate papulopustular acne vulgaris with post-inflammatory erythema (PIE)',
      plan: 'Topical Adapalene 0.1% + Benzoyl Peroxide 2.5% nocturnal, Doxycycline 100mg daily x 30 days, non-comedogenic SPF 50+.',
    },
    {
      category: 'Laser Therapy',
      name: 'Alexandrite 755nm Laser Hair Reduction',
      chiefComplaint: 'Unwanted hair on facial and axillary regions',
      diagnosis: 'Hypertrichosis in Fitzpatrick skin type III',
      plan: 'Alexandrite 755nm, 18mm spot size, 14 J/cm2, 3ms pulse duration, DCD cooling 40/30. Immediate perifollicular edema noted.',
    },
  ],
};
