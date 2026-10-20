import { useState } from 'react';
import { Card, Segmented, Space, Tag, Typography, Input } from 'antd';
import { Box, Table as TableIcon } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';
import { EyeAnatomy3D } from './EyeAnatomy3D';
import { RetinalFundus2D } from './RetinalFundus2D';
import { OPHTHALMOLOGY_CONFIG } from './config';

const { Text, Title } = Typography;

export function OphthalmologyWorkspace(props: SpecialtyComponentProps) {
  const [viewMode, setViewMode] = useState<'3d_globe' | '2d_refraction'>('3d_globe');
  const [slitLampFindings, setSlitLampFindings] = useState(
    'Cornea clear without infiltrates; Anterior chamber deep and quiet (no cells/flare); Iris pattern normal; Lens clear bilateral.'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Banner */}
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
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
                {OPHTHALMOLOGY_CONFIG.nameEn}
              </Title>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
                {OPHTHALMOLOGY_CONFIG.nameAr}
              </Tag>
            </div>
            <Text style={{ color: '#bfdbfe', fontSize: 12 }}>
              {OPHTHALMOLOGY_CONFIG.taglineEn}
            </Text>
          </div>

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            options={[
              { value: '3d_globe', label: <Space size={4}><Box size={13} /> 3D Ocular Globe</Space> },
              { value: '2d_refraction', label: <Space size={4}><TableIcon size={13} /> 2D Refraction &amp; VA</Space> },
            ]}
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#ffffff' }}
          />
        </div>
      </Card>

      {/* Visualizers */}
      {viewMode === '3d_globe' && <EyeAnatomy3D {...props} />}
      {viewMode === '2d_refraction' && <RetinalFundus2D {...props} />}

      {/* Slit Lamp Biomicroscopy */}
      <Card size="small" title="Slit Lamp Biomicroscopy &amp; Fundoscopy">
        <Input.TextArea
          rows={3}
          value={slitLampFindings}
          onChange={(e) => setSlitLampFindings(e.target.value)}
          placeholder="Detailed anterior segment and posterior segment examination..."
        />
      </Card>
    </div>
  );
}
