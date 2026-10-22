import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';

/** Row shape returned by `GET /patients` (snake_case, straight from Postgres). */
export interface PatientRow {
  id: string;
  clinic_id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Loads the patient directory from the API.
 *
 * `PatientsView` used to render three hardcoded demo rows (Ahmad / Sara /
 * Mohamed), so a database with 30 seeded clients still looked empty and mostly
 * male. The list now comes from `GET /patients`.
 */
export function usePatients(search?: string) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/patients', { params: { limit: 100, ...(search ? { search } : {}) } })
      .then((res: any) => {
        if (cancelled) return;
        // The response interceptor unwraps the HTTP response, so `res` is the
        // full API envelope `{ success, data, meta, timestamp }`.
        //   • /dashboard/summary  → data is an object
        //   • /patients           → data is the row array, meta holds paging
        // Accept a bare array too, in case a proxy ever strips the envelope.
        const payload = res?.data ?? res;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
              ? payload.items
              : [];
        setPatients(rows);
        setError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load patients');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce, search]);

  return { patients, loading, error, refetch };
}
