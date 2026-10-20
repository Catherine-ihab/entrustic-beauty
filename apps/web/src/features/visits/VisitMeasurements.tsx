import { useState } from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const { Text } = Typography;

interface MeasurementItem {
  key: string;
  label: string;
  value: number;
  unit: string;
  delta?: 'up' | 'down' | 'stable';
  deltaText?: string;
}

interface VisitMeasurementsProps {
  visitId?: string;
  readonly?: boolean;
}

export function VisitMeasurements({}: VisitMeasurementsProps) {
  const [measurements] = useState<MeasurementItem[]>([
    { key: 'bp_systolic', label: 'Blood Pressure (Sys)', value: 120, unit: 'mmHg', delta: 'stable', deltaText: 'Normal' },
    { key: 'bp_diastolic', label: 'Blood Pressure (Dia)', value: 80, unit: 'mmHg', delta: 'stable', deltaText: 'Normal' },
    { key: 'heart_rate', label: 'Heart Rate', value: 72, unit: 'bpm', delta: 'down', deltaText: '-4 vs last visit' },
    { key: 'weight', label: 'Weight', value: 78.5, unit: 'kg', delta: 'down', deltaText: '-0.8 kg' },
    { key: 'pain_score', label: 'Pain Score', value: 4, unit: '0-10', delta: 'down', deltaText: 'Improved (-2)' },
  ]);

  const renderDelta = (delta?: 'up' | 'down' | 'stable', text?: string) => {
    if (!delta || !text) return null;
    if (delta === 'down') {
      return (
        <span style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingDown size={12} /> {text}
        </span>
      );
    }
    if (delta === 'up') {
      return (
        <span style={{ fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp size={12} /> {text}
        </span>
      );
    }
    return (
      <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Minus size={12} /> {text}
      </span>
    );
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#2563EB" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Vitals & Clinical Measurements</span>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Row gutter={[12, 12]}>
        {measurements.map((m, idx) => (
          <Col xs={12} sm={8} md={4} key={idx} style={{ minWidth: 130 }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <Text style={{ fontSize: 11, color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {m.label}
              </Text>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                  {m.value}
                </span>
                <span style={{ fontSize: 11, color: '#64748B' }}>{m.unit}</span>
              </div>
              <div style={{ marginTop: 4 }}>
                {renderDelta(m.delta, m.deltaText)}
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
