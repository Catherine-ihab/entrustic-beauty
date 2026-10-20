import { useState } from 'react';
import { Card, Segmented, Space, Tag } from 'antd';
import { InteractiveMap } from '../../design-system/InteractiveMap/InteractiveMap';
import { BODY_FRONT_MAP, BODY_BACK_MAP, FACE_ZONES_MAP } from '../../design-system/InteractiveMap/definitions';
import type { SpecialtyComponentProps } from '../types';

export function BodyAndFaceMap2D(props: SpecialtyComponentProps) {
  const [mapType, setMapType] = useState<'face' | 'body_front' | 'body_back'>('face');

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span style={{ fontWeight: 600 }}>2D Clinical Topography &amp; Dermatome Map</span>
            <Tag color="purple">Interactive Vector</Tag>
          </Space>
          <Segmented
            size="small"
            value={mapType}
            onChange={(v) => setMapType(v as any)}
            options={[
              { value: 'face', label: 'Facial Zones' },
              { value: 'body_front', label: 'Body (Anterior)' },
              { value: 'body_back', label: 'Body (Posterior)' },
            ]}
          />
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {mapType === 'face' && <InteractiveMap definition={FACE_ZONES_MAP} readonly={props.readonly} />}
        {mapType === 'body_front' && <InteractiveMap definition={BODY_FRONT_MAP} readonly={props.readonly} />}
        {mapType === 'body_back' && <InteractiveMap definition={BODY_BACK_MAP} readonly={props.readonly} />}
      </div>
    </Card>
  );
}
