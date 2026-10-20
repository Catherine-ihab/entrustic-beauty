import { ClinicType } from '@clinic/shared-types';

/**
 * Specialty lock — this build is a single-specialty program.
 *
 * Generated for the **Dermatology** specialty by
 * scripts/generate-specialty-programs.mjs — do not switch this back to null
 * unless you want the multi-tenant behavior (all specialties) again.
 */
export const SPECIALTY_LOCK: ClinicType | null = ClinicType.DERMATOLOGY;
