import { useState } from 'react';
import { Card, Segmented, Space } from 'antd';
import { Sparkles, HeartHandshake, Bath } from 'lucide-react';
import { SkinCareWorkspaceView } from './SkinCareWorkspaceView';
import { SpaMassageView } from '../spa/SpaMassageView';
import { BodyCareView } from '../bodycare/BodyCareView';
import { useLang } from '../../lib/useLang';

interface SkinCareSpaCombinedViewProps {
  initialTab?: 'skincare' | 'bodycare' | 'spa';
}

export function SkinCareSpaCombinedView({ initialTab = 'skincare' }: SkinCareSpaCombinedViewProps) {
  const [activeTab, setActiveTab] = useState<'skincare' | 'bodycare' | 'spa'>(initialTab);
  const { tx } = useLang();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Unified Switcher */}
      <Card
        size="small"
        style={{
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        bodyStyle={{ padding: '8px 12px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Segmented
            size="large"
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            options={[
              {
                value: 'skincare',
                label: (
                  <Space size={6}>
                    <Sparkles size={16} color="#be185d" />
                    <span style={{ fontWeight: 700 }}>
                      {tx('العناية ببشرة الوجه والماسكات والأجهزة (Face Care & Masks)', 'Facial Care, Face Masks & Devices')}
                    </span>
                  </Space>
                ),
              },
              {
                value: 'bodycare',
                label: (
                  <Space size={6}>
                    <HeartHandshake size={16} color="#7c3aed" />
                    <span style={{ fontWeight: 700 }}>
                      {tx('العناية بالجسم وسنفرة البشرة (Body Care & Scrubs)', 'Body Care & Scrubs')}
                    </span>
                  </Space>
                ),
              },
              {
                value: 'spa',
                label: (
                  <Space size={6}>
                    <Bath size={16} color="#0d9488" />
                    <span style={{ fontWeight: 700 }}>
                      {tx('السبا والمساج والحمام المغربي (Spa & Massage)', 'Spa, Massage & Moroccan Bath')}
                    </span>
                  </Space>
                ),
              },
            ]}
            style={{ background: '#F1F5F9', borderRadius: 8, padding: 3 }}
          />
        </div>
      </Card>

      {/* Active Tab View */}
      {activeTab === 'skincare' && <SkinCareWorkspaceView />}
      {activeTab === 'bodycare' && <BodyCareView />}
      {activeTab === 'spa' && <SpaMassageView />}
    </div>
  );
}
