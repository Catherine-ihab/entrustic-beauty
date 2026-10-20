import { Card, Col, Empty, Row, Typography } from 'antd';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { MeasurementTrend } from '@clinic/shared-types';

const { Text, Title } = Typography;

/**
 * Canonical vitals metadata — keys match the seed/API conventions. Unknown
 * keys still render (title-cased raw key), so any specialty measurement that
 * flows through visit_measurements gets a usable card for free.
 */
export const VITAL_KEY_META: Record<string, { label: string; decimals?: number }> = {
  weight: { label: 'Weight', decimals: 1 },
  bp_systolic: { label: 'Blood pressure (systolic)' },
  bp_diastolic: { label: 'Blood pressure (diastolic)' },
  heart_rate: { label: 'Heart rate' },
  temperature: { label: 'Body temperature', decimals: 1 },
  spo2: { label: 'Oxygen saturation (SpO₂)' },
  blood_glucose: { label: 'Blood glucose' },
  pain_score: { label: 'Pain score' },
};

export const DEFAULT_VITAL_ORDER = [
  'weight',
  'bp_systolic',
  'bp_diastolic',
  'heart_rate',
  'temperature',
  'spo2',
  'blood_glucose',
  'pain_score',
];

export function vitalLabel(key: string): string {
  return (
    VITAL_KEY_META[key]?.label ?? key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
  );
}

export function formatVitalValue(key: string, value: number): string {
  const decimals = VITAL_KEY_META[key]?.decimals;
  return decimals != null ? value.toFixed(decimals) : String(Math.round(value * 100) / 100);
}

/** Canonical vitals first (in body-order), then any other keys alphabetically. */
export function sortTrends(trends: MeasurementTrend[]): MeasurementTrend[] {
  const order = (key: string) => {
    const i = DEFAULT_VITAL_ORDER.indexOf(key);
    return i === -1 ? DEFAULT_VITAL_ORDER.length : i;
  };
  return [...trends].sort((a, b) => order(a.key) - order(b.key) || a.key.localeCompare(b.key));
}

/**
 * Dependency-free sparkline: scaled polyline + shaded area + last-point marker.
 * Degenerates gracefully (single dot) for a lone reading.
 */
function Sparkline({ trend }: { trend: MeasurementTrend }) {
  const pts = trend.points;
  const W = 240;
  const H = 64;
  const PAD = 6;
  if (pts.length === 0) return null;
  if (pts.length === 1) {
    return (
      <svg
        width={W}
        height={H}
        role="img"
        aria-label={`${vitalLabel(trend.key)} — single reading`}
      >
        <circle cx={W / 2} cy={H / 2} r={4} fill="#1677ff" />
      </svg>
    );
  }
  const values = pts.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (pts.length - 1);
  const y = (v: number) => H - PAD - ((v - min) * (H - PAD * 2)) / span;
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const base = H - PAD;
  const area = `${x(0).toFixed(1)},${base} ${line} ${x(pts.length - 1).toFixed(1)},${base}`;
  const lastX = x(pts.length - 1);
  const lastY = y(values[values.length - 1]);
  return (
    <svg width={W} height={H} role="img" aria-label={`${vitalLabel(trend.key)} trend`}>
      <polygon points={area} fill="rgba(22,119,255,0.10)" />
      <polyline
        points={line}
        fill="none"
        stroke="#1677ff"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={3.5} fill="#1677ff" />
    </svg>
  );
}

export function TrendCard({ trend }: { trend: MeasurementTrend }) {
  const first = trend.points[0];
  const last = trend.points[trend.points.length - 1];
  const delta = trend.points.length >= 2 ? trend.latest - first.value : 0;
  const dir = delta > 0.0001 ? 'up' : delta < -0.0001 ? 'down' : 'stable';
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  return (
    <Card size="small" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <Text strong>{vitalLabel(trend.key)}</Text>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {trend.unit}
        </Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
        <Title level={3} style={{ margin: 0 }}>
          {formatVitalValue(trend.key, trend.latest)}
        </Title>
        {trend.points.length >= 2 && (
          <Text type="secondary" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon size={13} />
            {delta > 0 ? '+' : ''}
            {formatVitalValue(trend.key, delta)} since {dayLabel(first?.at)}
          </Text>
        )}
      </div>
      <div style={{ marginTop: 6 }}>
        <Sparkline trend={trend} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {trend.points.length} reading{trend.points.length === 1 ? '' : 's'}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          min {formatVitalValue(trend.key, trend.min)} · max {formatVitalValue(trend.key, trend.max)}
          {last ? ` · ${dayLabel(last.at)}` : ''}
        </Text>
      </div>
    </Card>
  );
}

function dayLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function VitalsTrendsGrid({
  trends,
  emptyText = 'No measurements recorded yet.',
}: {
  trends: MeasurementTrend[];
  emptyText?: string;
}) {
  if (!trends.length) {
    return <Empty description={emptyText} style={{ padding: '32px 0' }} />;
  }
  return (
    <Row gutter={[16, 16]}>
      {sortTrends(trends).map((trend) => (
        <Col key={trend.key} xs={24} sm={12} xl={8}>
          <TrendCard trend={trend} />
        </Col>
      ))}
    </Row>
  );
}
