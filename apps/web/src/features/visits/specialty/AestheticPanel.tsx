import { useState } from 'react';
import { Card, Tag, Typography, Table } from 'antd';
import { Sparkles } from 'lucide-react';
import { InteractiveMap, RegionModal, FACE_ZONES_MAP, MapRegion, RegionState, StatusConfig } from '../../../design-system/InteractiveMap';

const { Text } = Typography;

interface AestheticPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

const AESTHETIC_STATUS_CONFIG: Record<string, StatusConfig> = {
  injected:   { label: 'Injected Today',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  planned:    { label: 'Planned Next',     color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  touchup:    { label: 'Touch-Up Area',    color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  caution:    { label: 'High Risk Vessel', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  untouched:  { label: 'Not Indicated',    color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
};

export function AestheticPanel({ readonly = false }: AestheticPanelProps) {
  const [regionStates, setRegionStates] = useState<Record<string, RegionState>>({
    glabella: {
      status: 'injected',
      notes: 'Botox 12 units intramuscular',
      details: { product: 'Botox (Allergan)', units: '12 U' },
    },
    crows_feet_r: {
      status: 'injected',
      notes: 'Botox 6 units intradermal',
      details: { product: 'Botox (Allergan)', units: '6 U' },
    },
    crows_feet_l: {
      status: 'injected',
      notes: 'Botox 6 units intradermal',
      details: { product: 'Botox (Allergan)', units: '6 U' },
    },
    nasolabial_r: {
      status: 'planned',
      notes: 'Hyaluronic acid filler planned for next session',
      details: { product: 'Juvederm Ultra 3', units: '0.5 ml' },
    },
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

  // Compute table of injected zones
  const injectedRecords = Object.entries(regionStates)
    .filter(([_, state]) => state.status === 'injected' || state.status === 'planned')
    .map(([regionId, state]) => {
      const reg = FACE_ZONES_MAP.regions.find((r: MapRegion) => r.id === regionId);
      return {
        key: regionId,
        area: reg?.label || regionId,
        status: state.status,
        product: state.details?.product || '—',
        units: state.details?.units || '—',
        notes: state.notes || '—',
      };
    });

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#7C3AED" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Aesthetic Facial Mapping & Injectables</span>
          <Tag color="purple" style={{ borderRadius: 6, fontSize: 11 }}>Aesthetic & Cosmetics</Tag>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Text style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 12 }}>
        Click any facial anatomical zone to document neurotoxin/filler units, batch numbers, and injection technique.
      </Text>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <InteractiveMap
          definition={FACE_ZONES_MAP}
          regionStates={regionStates}
          onRegionClick={handleRegionClick}
          statusConfig={AESTHETIC_STATUS_CONFIG}
          height={380}
          readonly={readonly}
        />

        {injectedRecords.length > 0 && (
          <div>
            <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 8 }}>
              Active Session Injection Log ({injectedRecords.length} zones)
            </Text>
            <Table
              size="small"
              dataSource={injectedRecords}
              pagination={false}
              columns={[
                { title: 'Zone', dataIndex: 'area', key: 'area' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (s: string) => (
                    <Tag color={s === 'injected' ? 'blue' : 'gold'}>{s.toUpperCase()}</Tag>
                  ),
                },
                { title: 'Product', dataIndex: 'product', key: 'product' },
                { title: 'Dose / Volume', dataIndex: 'units', key: 'units' },
                { title: 'Technique / Notes', dataIndex: 'notes', key: 'notes' },
              ]}
              style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0' }}
            />
          </div>
        )}
      </div>

      <RegionModal
        region={selectedRegion}
        currentState={selectedRegion ? regionStates[selectedRegion.id] : undefined}
        statusConfig={AESTHETIC_STATUS_CONFIG}
        open={selectedRegion !== null}
        onCancel={() => setSelectedRegion(null)}
        onSave={handleSaveState}
        extraFields="aesthetic"
      />
    </Card>
  );
}
