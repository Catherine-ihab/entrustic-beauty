import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';

/** Row shape returned by `GET /audit` (already camelCase, matches IAuditLogEntry). */
export interface AuditLogRow {
  id: string;
  clinicId: string;
  userId: string | null;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/**
 * Loads the immutable clinical audit trail from `GET /audit`.
 *
 * The view used to render three fabricated rows (dr.tariq@beauty-clinic.com,
 * 192.168.1.104, "PATIENTp-1") while the database already held the real trail.
 */
export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/audit')
      .then((res: any) => {
        if (cancelled) return;
        // The response interceptor unwraps the HTTP response, so `res` is the
        // envelope `{ success, data, meta, timestamp }`.
        const payload = res?.data ?? res;
        setLogs(Array.isArray(payload) ? payload : (payload?.items ?? []));
        setError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load audit logs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { logs, loading, error, refetch };
}
