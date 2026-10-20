import { useState } from 'react';
import { Card, Row, Col, Typography, Input, Tag } from 'antd';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

export function RetinalFundus2D({ readonly = false }: SpecialtyComponentProps) {
  // OD (Right Eye) & OS (Left Eye) Refraction
  const [odVa, setOdVa] = useState('20/20');
  const [osVa, setOsVa] = useState('20/25');
  const [odSphere, setOdSphere] = useState('-1.50');
  const [osSphere, setOsSphere] = useState('-1.75');
  const [odCyl, setOdCyl] = useState('-0.50');
  const [osCyl, setOsCyl] = useState('-0.75');
  const [odAxis, setOdAxis] = useState('180');
  const [osAxis, setOsAxis] = useState('175');

  return (
    <Card size="small" title="2D Visual Acuity, Subjective Refraction &amp; Slit Lamp Matrix">
      <Row gutter={[16, 12]}>
        <Col span={12}>
          <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ color: '#2563EB' }}>OD · Right Eye (Oculus Dexter)</Text>
              <Tag color="blue">VA: {odVa}</Tag>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>VA (Snellen)</Text>
                <Input size="small" value={odVa} onChange={(e) => setOdVa(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Sphere</Text>
                <Input size="small" value={odSphere} onChange={(e) => setOdSphere(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Cylinder</Text>
                <Input size="small" value={odCyl} onChange={(e) => setOdCyl(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Axis (°)</Text>
                <Input size="small" value={odAxis} onChange={(e) => setOdAxis(e.target.value)} disabled={readonly} />
              </div>
            </div>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ color: '#0891B2' }}>OS · Left Eye (Oculus Sinister)</Text>
              <Tag color="cyan">VA: {osVa}</Tag>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>VA (Snellen)</Text>
                <Input size="small" value={osVa} onChange={(e) => setOsVa(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Sphere</Text>
                <Input size="small" value={osSphere} onChange={(e) => setOsSphere(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Cylinder</Text>
                <Input size="small" value={osCyl} onChange={(e) => setOsCyl(e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Axis (°)</Text>
                <Input size="small" value={osAxis} onChange={(e) => setOsAxis(e.target.value)} disabled={readonly} />
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
