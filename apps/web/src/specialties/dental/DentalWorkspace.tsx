import { useState } from 'react';
import { Card, Segmented, Space, Tag, Typography, Row, Col, Input } from 'antd';
import { Box, Grid } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';
import { DentalJaw3D } from './DentalJaw3D';
import { DentalOdontogram2D } from './DentalOdontogram2D';
import { DENTAL_CONFIG } from './config';

const { Text, Title } = Typography;

export function DentalWorkspace(props: SpecialtyComponentProps) {
  const [activeVisualMode, setActiveVisualMode] = useState<'3d' | '2d' | 'both'>('3d');
  const [perioNotes, setPerioNotes] = useState('');
  const [occlusionType, setOcclusionType] = useState('Angle Class I');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Dental Specialty Header Bar */}
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #0369A1 0%, #0369a1 100%)',
          border: 'none',
          color: '#ffffff',
          borderRadius: 10,
        }}
        bodyStyle={{ padding: '12px 18px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={5} style={{ color: '#ffffff', margin: 0 }}>
                {DENTAL_CONFIG.nameEn}
              </Title>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
                {DENTAL_CONFIG.nameAr}
              </Tag>
            </div>
            <Text style={{ color: '#e0f2fe', fontSize: 12 }}>
              {DENTAL_CONFIG.taglineEn}
            </Text>
          </div>

          <Segmented
            value={activeVisualMode}
            onChange={(val) => setActiveVisualMode(val as any)}
            options={[
              { value: '3d', label: <Space size={4}><Box size={13} /> 3D Dental Arch</Space> },
              { value: '2d', label: <Space size={4}><Grid size={13} /> 2D Odontogram</Space> },
              { value: 'both', label: 'Split (2D + 3D)' },
            ]}
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#ffffff' }}
          />
        </div>
      </Card>

      {/* Visualizer Area */}
      {activeVisualMode === '3d' && <DentalJaw3D {...props} />}
      {activeVisualMode === '2d' && <DentalOdontogram2D {...props} />}
      {activeVisualMode === 'both' && (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <DentalJaw3D {...props} />
          </Col>
          <Col span={12}>
            <DentalOdontogram2D {...props} />
          </Col>
        </Row>
      )}

      {/* Periodontal & Occlusion Specialized Notes */}
      <Card size="small" title="Dental Examination &amp; Occlusal Assessment">
        <Row gutter={[16, 12]}>
          <Col span={8}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Occlusion Relationship</Text>
            <Input
              value={occlusionType}
              onChange={(e) => setOcclusionType(e.target.value)}
              placeholder="Angle Class I / II / III, Overjet/Overbite..."
            />
          </Col>
          <Col span={16}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Gingival &amp; Periodontal Observations</Text>
            <Input
              value={perioNotes}
              onChange={(e) => setPerioNotes(e.target.value)}
              placeholder="Bleeding on probing (BOP), furcation involvement, calculus deposits..."
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
