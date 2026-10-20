/**
 * Phase A6 — Vitals Trends.
 *
 * Measurements are stored as generic key/value rows (visit_measurements), so
 * trends are returned as one series per key — the UI renders whichever keys a
 * clinic actually records. All series are ordered oldest → newest.
 */

export interface MeasurementPoint {
  /** ISO timestamp of the reading (recorded_at) */
  at: string;
  value: number;
}

export interface MeasurementTrend {
  /** Measurement key, e.g. 'weight', 'bp_systolic', 'heart_rate' */
  key: string;
  unit: string;
  /** Ascending by recorded time */
  points: MeasurementPoint[];
  /** Value of the newest point */
  latest: number;
  min: number;
  max: number;
}

/** Staff + portal body for recording a standalone (optionally visit-linked) reading. */
export interface RecordMeasurementDto {
  key: string;
  value: number;
  unit: string;
  notes?: string;
  /** Optional link to one of the patient's visits */
  visitId?: string;
}
