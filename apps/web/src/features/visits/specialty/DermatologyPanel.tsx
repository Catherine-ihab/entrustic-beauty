import { useState } from 'react';
import { Card, Segmented, Tag, Typography } from 'antd';
import { Stethoscope } from 'lucide-react';
import { InteractiveMap, RegionModal, BODY_FRONT_MAP, BODY_BACK_MAP, MapRegion, RegionState, StatusConfig } from '../../../design-system/InteractiveMap';

const { Text } = Typography;

interface DermatologyPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

const DERM_STATUS_CONFIG: Record<string, StatusConfig> = {
  normal:     { label: 'Clear / Intact',   color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  erythema:   { label: 'Erythema / Rash',  color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  lesion:     { label: 'Macule / Papule',  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  biopsy:     { label: 'Biopsy Taken',     color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  treated:    { label: 'Topical Treated',  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
};

export function DermatologyPanel({ readonly = false }: DermatologyPanelProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [regionStates, setRegionStates] = useState<Record<string, RegionState>>({
    chest: { status: 'erythema', notes: 'Contact dermatitis erythematous patch' },
    arm_r: { status: 'lesion', notes: 'Hyperpigmented macule, benign appearance' },
  });
  const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null);

  const handleRegionClick = (region: MapRegion) => {
    setSelectedRegion(region);
  };

  const handleSaveState = (regionId: string, state: RegionState) => {
    setRegionStates((prev) => ({
      ...prev,
      [regionId]: state,
    }));
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stethoscope size={16} color="#2563EB" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Interactive Dermatological Body Map</span>
            <Tag color="magenta" style={{ borderRadius: 6, fontSize: 11 }}>Dermatology</Tag>
          </div>
          <Segmented
            value={view}
            onChange={(val) => setView(val as 'front' | 'back')}
            options={[
              { label: 'Anterior (Front)', value: 'front' },
              { label: 'Posterior (Back)', value: 'back' },
            ]}
          />
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Text style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 12 }}>
        Click any anatomical region to document rashes, lesions, biopsies, or topical therapies.
      </Text>

      <InteractiveMap
        definition={view === 'front' ? BODY_FRONT_MAP : BODY_BACK_MAP}
        regionStates={regionStates}
        onRegionClick={handleRegionClick}
        statusConfig={DERM_STATUS_CONFIG}
        height={440}
        readonly={readonly}
      />

      <RegionModal
        region={selectedRegion}
        currentState={selectedRegion ? regionStates[selectedRegion.id] : undefined}
        statusConfig={DERM_STATUS_CONFIG}
        open={selectedRegion !== null}
        onCancel={() => setSelectedRegion(null)}
        onSave={handleSaveState}
        extraFields="dermatology"
      />
    </Card>
  );
}
