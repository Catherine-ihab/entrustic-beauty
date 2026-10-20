import { useState } from 'react';
import { Card, Segmented, Space, Tag, Typography, Row, Col, InputNumber, Select } from 'antd';
import { Box, Map, Flame } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';
import { AestheticFace3D } from './AestheticFace3D';
import { BodyAndFaceMap2D } from './BodyAndFaceMap2D';
import { DERMA_AESTHETIC_CONFIG } from './config';
import { SessionCourseCard } from '../../features/sessions/SessionCourseCard';

const { Text, Title } = Typography;

export function DermaAestheticWorkspace(props: SpecialtyComponentProps) {
  const [viewMode, setViewMode] = useState<'3d_face' | '2d_maps'>('3d_face');

  // Laser parameters
  const [device, setDevice] = useState('Candela GentleMax Pro Plus');
  const [wavelength, setWavelength] = useState('755nm Alexandrite');
  const [fluence, setFluence] = useState(14);
  const [pulseDuration, setPulseDuration] = useState(3);
  const [spotSize, setSpotSize] = useState(18);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Banner */}
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
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
                {DERMA_AESTHETIC_CONFIG.nameEn}
              </Title>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
                {DERMA_AESTHETIC_CONFIG.nameAr}
              </Tag>
            </div>
            <Text style={{ color: '#fce7f3', fontSize: 12 }}>
              {DERMA_AESTHETIC_CONFIG.taglineEn}
            </Text>
          </div>

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            options={[
              { value: '3d_face', label: <Space size={4}><Box size={13} /> 3D Face Injectables</Space> },
              { value: '2d_maps', label: <Space size={4}><Map size={13} /> 2D Topography Maps</Space> },
            ]}
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#ffffff' }}
          />
        </div>
      </Card>

      {/* Visualizers */}
      {viewMode === '3d_face' && <AestheticFace3D {...props} />}
      {viewMode === '2d_maps' && <BodyAndFaceMap2D {...props} />}

      {/* Session Course Tracking — for laser / device courses */}
      <SessionCourseCard
        patientId={props.patientId || 'demo-patient'}
        clinicType="dermatology"
      />

      {/* Laser Protocol Parameters */}
      <Card
        size="small"
        title={
          <Space>
            <Flame size={15} color="#EC4899" />
            <span style={{ fontWeight: 600 }}>Laser Session Parameters (If Applicable)</span>
          </Space>
        }
      >
        <Row gutter={[16, 12]}>
          <Col span={8}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Laser Workstation</Text>
            <Select
              style={{ width: '100%' }}
              value={device}
              onChange={setDevice}
              options={[
                { value: 'Candela GentleMax Pro Plus', label: 'Candela GentleMax Pro Plus' },
                { value: 'Lumenis Stellar M22 IPL', label: 'Lumenis Stellar M22 IPL' },
                { value: 'Fotona SP Dynamis Nd:YAG/Er:YAG', label: 'Fotona SP Dynamis' },
                { value: 'Cutera Excel V+', label: 'Cutera Excel V+' },
              ]}
            />
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Fluence (J/cm²)</Text>
            <InputNumber
              style={{ width: '100%' }}
              value={fluence}
              onChange={(v) => setFluence(v ?? 0)}
              addonAfter="J/cm²"
            />
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Pulse Width</Text>
            <InputNumber
              style={{ width: '100%' }}
              value={pulseDuration}
              onChange={(v) => setPulseDuration(v ?? 0)}
              addonAfter="ms"
            />
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Spot Size</Text>
            <InputNumber
              style={{ width: '100%' }}
              value={spotSize}
              onChange={(v) => setSpotSize(v ?? 0)}
              addonAfter="mm"
            />
          </Col>
          <Col span={4}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Wavelength</Text>
            <Select
              style={{ width: '100%' }}
              value={wavelength}
              onChange={setWavelength}
              options={[
                { value: '755nm Alexandrite', label: '755nm Alex' },
                { value: '1064nm Nd:YAG', label: '1064nm Nd:YAG' },
                { value: '532nm KTP', label: '532nm KTP' },
                { value: '2940nm Er:YAG', label: '2940nm Er:YAG' },
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
