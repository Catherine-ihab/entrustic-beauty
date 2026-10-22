import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';

export interface DashboardSummary {
  patients: { total: number; active: number; newThisMonth: number };
  appointments: {
    today: number;
    todayCompleted: number;
    todayRemaining: number;
    inProgress: number;
    waiting: number;
    upcoming: number;
  };
  revenue: {
    todayCollected: number;
    todayBilled: number;
    todayPending: number;
    monthCollected: number;
    currency: string;
  };
  capacity: { bookedToday: number; dailySlots: number; utilizationPercent: number };
  todaySchedule: Array<{
    id: string;
    startTime: string;
    patientName: string;
    patientNumber: string;
    service: string | null;
    provider: string;
    status: string;
  }>;
  devices: Array<{
    id: string;
    name: string;
    model: string | null;
    status: string;
    nextCalibration: string | null;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    unit: string | null;
    remaining: number;
    reorderLevel: number;
  }>;
}

/**
 * Loads the server-side dashboard aggregates.
 *
 * The KPI tiles used to be hardcoded strings ("1,428", "12,450 EGP") and the
 * queue table read a localStorage store, so a fully-seeded database still
 * rendered a fabricated dashboard. Everything here now comes from
 * `GET /dashboard/summary`.
 */
export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/dashboard/summary')
      .then((res: any) => {
        if (cancelled) return;
        // The API wraps every payload as { success, data, ... }; the axios
        // interceptor only unwraps the HTTP response, so unwrap the envelope
        // here. Tolerate a bare object in case wrapping is ever disabled.
        setData((res?.data ?? res) as DashboardSummary);
        setError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { data, loading, error, refetch };
}
