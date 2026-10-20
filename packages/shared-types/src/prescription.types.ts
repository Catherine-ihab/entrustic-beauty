/**
 * Smart E-Prescription — shared DTOs used by the API and the Web app.
 */

export interface CreatePrescriptionItemDto {
  /** Drug catalog id — optional, allows free-text drugs too */
  drugId?: string;
  /** Display/trade name snapshot (required when drugId is absent) */
  drugName?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
}

export interface CreatePrescriptionDto {
  patientId: string;
  visitId?: string;
  notes?: string;
  items: CreatePrescriptionItemDto[];
}

export type PrescriptionWarningSeverity = 'minor' | 'moderate' | 'major' | 'life_threatening';

export interface PrescriptionWarning {
  type: 'drug_interaction' | 'allergy';
  severity: PrescriptionWarningSeverity;
  message: string;
  /** Names of the drugs involved (interaction) */
  drugs?: string[];
  /** Allergen matched (allergy) */
  allergen?: string;
  /** Matched drug name */
  drugName?: string;
}

export interface IDrug {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  form?: string;
  strength?: string;
  substances: string[];
  commonDoses?: string;
  isSeed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPrescription {
  id: string;
  patientId: string;
  visitId?: string;
  providerId: string;
  issuedAt: string;
  status: string;
  notes?: string;
  items: Array<{
    id: string;
    drugId?: string;
    drugName: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    quantity?: number;
  }>;
}

export interface IFavoriteDrug {
  drugId: string;
  usageCount: number;
  lastUsedAt: string;
  drug: IDrug;
}