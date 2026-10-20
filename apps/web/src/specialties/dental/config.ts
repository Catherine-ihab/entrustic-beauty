import { ClinicType } from '@clinic/shared-types';
import type { SpecialtyModuleConfig } from '../types';

export const DENTAL_CONFIG: SpecialtyModuleConfig = {
  id: ClinicType.DENTAL,
  nameEn: 'Dental & Oral Health',
  nameAr: 'طب وجراحة الفم والأسنان',
  taglineEn: 'Comprehensive Odontology, Endodontics, Orthodontics & Prosthetics',
  taglineAr: 'العلاج الشامل للأسنان، التقويم، التركيبات وزراعة الأسنان',
  icon: 'Tooth',
  themeColor: '#0ea5e9',
  has3DVisualizer: true,
  has2DVisualizer: true,
  measurements: [
    { key: 'periodontal_pocket_depth', label: 'Max Pocket Depth', unit: 'mm', type: 'number', defaultValue: 2 },
    { key: 'gingival_index', label: 'Gingival Index (0-3)', unit: 'grade', type: 'number', defaultValue: 0 },
    { key: 'plaque_score', label: 'Plaque Index', unit: '%', type: 'number', defaultValue: 15 },
    { key: 'mobility_grade', label: 'Tooth Mobility', unit: 'grade', type: 'select', options: ['0 (Normal)', 'I (Mild)', 'II (Moderate)', 'III (Severe)'] },
  ],
  quickTemplates: [
    {
      category: 'Restorative',
      name: 'Class I Composite Restoration',
      chiefComplaint: 'Food impaction and sensitivity to cold',
      diagnosis: 'Dental caries involving enamel and dentin without pulp exposure',
      plan: 'Infiltration anesthesia, caries excavation, bonding, composite shade A2, occlusion check & polishing',
    },
    {
      category: 'Endodontics',
      name: 'Root Canal Treatment (RCT)',
      chiefComplaint: 'Severe throbbing nocturnal tooth pain',
      diagnosis: 'Irreversible pulpitis with apical periodontitis',
      plan: 'Pulp extirpation, rotary biomechanical preparation, irrigation with NaOCl 2.5%, calcium hydroxide dressing, temporary seal',
    },
    {
      category: 'Surgery',
      name: 'Dental Implant Placement',
      chiefComplaint: 'Missing posterior tooth, difficulty masticating',
      diagnosis: 'Edentulous ridge with adequate bone volume (CBCT verified)',
      plan: 'Surgical guide stent, osteotomy preparation, fixture insertion at 35Ncm, cover screw placement, suturing',
    },
  ],
};
