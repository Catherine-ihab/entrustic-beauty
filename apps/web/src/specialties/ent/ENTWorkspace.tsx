import { Card, Tag, Typography } from 'antd';
import type { SpecialtyComponentProps } from '../types';
import { ENTPanel } from './ENTPanel';
import { ENT_CONFIG } from './config';

const { Text, Title } = Typography;

export function ENTWorkspace(props: SpecialtyComponentProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          border: 'none',
          color: '#ffffff',
          borderRadius: 10,
        }}
        bodyStyle={{ padding: '12px 18px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={5} style={{ color: '#ffffff', margin: 0 }}>
            {ENT_CONFIG.nameEn}
          </Title>
          <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
            {ENT_CONFIG.nameAr}
          </Tag>
        </div>
        <Text style={{ color: '#ede9fe', fontSize: 12 }}>
          {ENT_CONFIG.taglineEn}
        </Text>
      </Card>

      <ENTPanel {...props} />
    </div>
  );
}
