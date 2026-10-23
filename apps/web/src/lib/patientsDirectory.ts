// Centralized Clinic Patients Directory for Session Recording & Search
import { apiClient } from './api-client';

export interface RegisteredPatient {
  id: string;
  patientNumber: string; // e.g. PAT-00160
  name: string;          // e.g. سلمى إبراهيم
  phone: string;         // e.g. 01012345678
  gender?: string;
}

/**
 * Placeholder list shown for the split second before `GET /patients` answers.
 * The real directory is loaded from the API at login (see `ensurePatientsSynced`)
 * so screens never show patient numbers that do not exist in the database.
 */
export const DEFAULT_REGISTERED_PATIENTS: RegisteredPatient[] = [
  {
    id: 'p-loading',
    patientNumber: '—',
    name: 'جارٍ تحميل دليل الحالات…',
    phone: '',
    gender: 'أنثى',
  },
];

const LS_PATIENTS_DIRECTORY = 'clinic_registered_patients_directory_v1';
export const PATIENTS_EVENT_NAME = 'clinic_patients_directory_updated';

export function getRegisteredPatients(): RegisteredPatient[] {
  try {
    const stored = localStorage.getItem(LS_PATIENTS_DIRECTORY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading patients directory:', e);
  }
  return DEFAULT_REGISTERED_PATIENTS;
}

export function saveRegisteredPatients(patients: RegisteredPatient[]): void {
  try {
    localStorage.setItem(LS_PATIENTS_DIRECTORY, JSON.stringify(patients));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PATIENTS_EVENT_NAME, { detail: patients }));
    }
  } catch (e) {
    console.error('Error saving patients directory:', e);
  }
}

export function subscribeToRegisteredPatients(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handle = () => callback();
  window.addEventListener(PATIENTS_EVENT_NAME, handle);
  window.addEventListener('storage', handle);
  return () => {
    window.removeEventListener(PATIENTS_EVENT_NAME, handle);
    window.removeEventListener('storage', handle);
  };
}

/** Row shape returned by `GET /patients` (snake_case, straight from Postgres). */
interface ApiPatientRow {
  id: string;
  patient_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  gender?: string | null;
}

const mapApiRow = (r: ApiPatientRow): RegisteredPatient => ({
  id: r.id,
  patientNumber: (r.patient_number || r.id.slice(0, 8)).trim(),
  name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.replace(/\s+/g, ' ').trim(),
  phone: (r.phone || '').trim(),
  gender: r.gender || 'أنثى',
});

let inflight: Promise<RegisteredPatient[]> | null = null;

/**
 * Replaces the whole local directory with the real clinic roster.
 *
 * Several demo screens (laser, injectables, packages, invoices, …) used to
 * hardcode a handful of fake patients such as `PAT-00104`, so the same clinic
 * showed one roster on "الحالات" and a completely different, fake one
 * everywhere else. They now all read the real patients.
 */
export function syncPatientsFromApi(): Promise<RegisteredPatient[]> {
  if (inflight) return inflight;
  inflight = apiClient
    .get('/patients', { params: { limit: 200 } })
    .then((res: any) => {
      const payload = res?.data ?? res;
      const rows: ApiPatientRow[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
      const mapped = rows.map(mapApiRow).filter((p) => p.name && p.patientNumber !== '—');
      if (!mapped.length) return getRegisteredPatients();
      saveRegisteredPatients(mapped);
      return mapped;
    })
    .catch(() => {
      inflight = null;
      return getRegisteredPatients();
    });
  return inflight;
}

/** Idempotent, cached entry point used by the app shell after login. */
export function ensurePatientsSynced(): Promise<RegisteredPatient[]> {
  return syncPatientsFromApi();
}

export function saveRegisteredPatient(patient: RegisteredPatient): void {
  const current = getRegisteredPatients().filter((p) => p.patientNumber !== '—');
  const existingIndex = current.findIndex(
    (p) => p.patientNumber === patient.patientNumber || p.id === patient.id
  );
  let updated: RegisteredPatient[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...patient };
  } else {
    updated = [patient, ...current];
  }
  saveRegisteredPatients(updated);
}
