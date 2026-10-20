import { Card, Tag, Typography } from 'antd';
import type { SpecialtyComponentProps } from '../types';
import { NutritionPanel } from './NutritionPanel';
import { NUTRITION_CONFIG } from './config';

const { Text, Title } = Typography;

export function NutritionWorkspace(props: SpecialtyComponentProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          border: 'none',
          color: '#ffffff',
          borderRadius: 10,
        }}
        bodyStyle={{ padding: '12px 18px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={5} style={{ color: '#ffffff', margin: 0 }}>
            {NUTRITION_CONFIG.nameEn}
          </Title>
          <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
            {NUTRITION_CONFIG.nameAr}
          </Tag>
        </div>
        <Text style={{ color: '#d1fae5', fontSize: 12 }}>
          {NUTRITION_CONFIG.taglineEn}
        </Text>
      </Card>

      <NutritionPanel {...props} />
    </div>
  );
}
