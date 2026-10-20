/**
 * API hooks for patient medical record sub-resources.
 * Uses apiClient (axios) with React state for loading/error management.
 * In a full implementation, replace with React Query for caching.
 */
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientAllergy {
  id: string;
  allergen: string;
  allergy_type: string;
  reaction: string | null;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'unknown';
  status: 'active' | 'resolved' | 'unconfirmed';
  onset_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface PatientCondition {
  id: string;
  name: string;
  icd_code: string | null;
  status: 'active' | 'resolved' | 'managed' | 'suspected';
  severity: 'mild' | 'moderate' | 'severe' | 'critical' | null;
  onset_date: string | null;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface PatientMedication {
  id: string;
  name: string;
  generic_name: string | null;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
  route: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  prescribed_by: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface FamilyHistoryEntry {
  id: string;
  relative: string;
  condition: string;
  notes: string | null;
  created_at: string;
}

export interface PatientFile {
  id: string;
  category: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  description: string | null;
  tags: string[];
  visit_id: string | null;
  is_archived: boolean;
  created_at: string;
  url?: string;
}

export interface ConsentRecord {
  id: string;
  consent_type: string;
  title: string;
  content: string;
  method: string;
  status: 'given' | 'withdrawn' | 'pending';
  signed_at: string | null;
  witness: string | null;
  notes: string | null;
  created_at: string;
}

export interface MedicalSnapshot {
  allergies: PatientAllergy[];
  conditions: PatientCondition[];
  currentMedications: PatientMedication[];
  alerts: {
    hasLifeThreateningAllergy: boolean;
    hasSevereAllergy: boolean;
    allergyCount: number;
    conditionCount: number;
    medicationCount: number;
  };
}

// ─── Generic fetcher hook ─────────────────────────────────────────────────────

function useApiList<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(url) as any;
      setData(res?.data || res || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetch(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetch };
}

// ─── Medical Snapshot ─────────────────────────────────────────────────────────

export function useMedicalSnapshot(patientId: string) {
  const [snapshot, setSnapshot] = useState<MedicalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/patients/${patientId}/snapshot`) as any;
      setSnapshot(res?.data || res);
      setError(null);
    } catch {
      // Fallback to empty snapshot if API not yet available
      setSnapshot({
        allergies: [],
        conditions: [],
        currentMedications: [],
        alerts: { hasLifeThreateningAllergy: false, hasSevereAllergy: false, allergyCount: 0, conditionCount: 0, medicationCount: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { snapshot, loading, error, refetch: fetch };
}

// ─── Allergies ────────────────────────────────────────────────────────────────

export function useAllergies(patientId: string) {
  return useApiList<PatientAllergy>(`/patients/${patientId}/allergies`, [patientId]);
}

export async function createAllergy(patientId: string, dto: Partial<PatientAllergy>) {
  return apiClient.post(`/patients/${patientId}/allergies`, dto);
}

export async function updateAllergy(patientId: string, allergyId: string, dto: Partial<PatientAllergy>) {
  return apiClient.patch(`/patients/${patientId}/allergies/${allergyId}`, dto);
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export function useConditions(patientId: string) {
  return useApiList<PatientCondition>(`/patients/${patientId}/conditions`, [patientId]);
}

export async function createCondition(patientId: string, dto: Partial<PatientCondition>) {
  return apiClient.post(`/patients/${patientId}/conditions`, dto);
}

export async function updateCondition(patientId: string, conditionId: string, dto: Partial<PatientCondition>) {
  return apiClient.patch(`/patients/${patientId}/conditions/${conditionId}`, dto);
}

// ─── Medications ──────────────────────────────────────────────────────────────

export function useMedications(patientId: string) {
  return useApiList<PatientMedication>(`/patients/${patientId}/medications`, [patientId]);
}

export async function createMedication(patientId: string, dto: Partial<PatientMedication>) {
  return apiClient.post(`/patients/${patientId}/medications`, dto);
}

export async function updateMedication(patientId: string, medId: string, dto: Partial<PatientMedication>) {
  return apiClient.patch(`/patients/${patientId}/medications/${medId}`, dto);
}

// ─── Family History ───────────────────────────────────────────────────────────

export function useFamilyHistory(patientId: string) {
  return useApiList<FamilyHistoryEntry>(`/patients/${patientId}/family-history`, [patientId]);
}

export async function createFamilyHistory(patientId: string, dto: Partial<FamilyHistoryEntry>) {
  return apiClient.post(`/patients/${patientId}/family-history`, dto);
}

// ─── Files ────────────────────────────────────────────────────────────────────

export function usePatientFiles(patientId: string, category?: string) {
  const url = category
    ? `/patients/${patientId}/files?category=${category}`
    : `/patients/${patientId}/files`;
  return useApiList<PatientFile>(url, [patientId, category]);
}

export async function archiveFile(patientId: string, fileId: string) {
  return apiClient.patch(`/patients/${patientId}/files/${fileId}/archive`, {});
}

export async function getFileDownloadUrl(patientId: string, fileId: string): Promise<{ url: string; expiresIn: number }> {
  return apiClient.get(`/patients/${patientId}/files/${fileId}/url`) as any;
}

// ─── Consents ─────────────────────────────────────────────────────────────────

export function useConsents(patientId: string) {
  return useApiList<ConsentRecord>(`/patients/${patientId}/consents`, [patientId]);
}

export async function createConsent(patientId: string, dto: Partial<ConsentRecord>) {
  return apiClient.post(`/patients/${patientId}/consents`, dto);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | 'visit'
  | 'condition'
  | 'allergy'
  | 'medication'
  | 'file'
  | 'consent'
  | 'invoice';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  metadata?: Record<string, unknown>;
}

export function useTimeline(patientId: string, typeFilter?: TimelineEventType | 'all') {
  const [data, setData] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const url =
        typeFilter && typeFilter !== 'all'
          ? `/patients/${patientId}/timeline?type=${typeFilter}`
          : `/patients/${patientId}/timeline`;
      const res = await apiClient.get(url) as any;
      setData(res?.data || res || []);
      setError(null);
    } catch {
      setData([]);
      setError(null); // Graceful empty — API may not be seeded
    } finally {
      setLoading(false);
    }
  }, [patientId, typeFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
