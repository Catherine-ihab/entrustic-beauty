import { useState } from 'react';
import { Card, Tag, Modal, Radio, Input, Typography, Space } from 'antd';
import { Sparkles } from 'lucide-react';

const { Text } = Typography;

interface ToothState {
  status: 'healthy' | 'decay' | 'filled' | 'crown' | 'root_canal' | 'extracted' | 'implant';
  notes?: string;
}

const TOOTH_STATUS_CONFIG: Record<
  ToothState['status'],
  { label: string; bg: string; border: string; text: string }
> = {
  healthy:    { label: 'Healthy',    bg: '#F0FDF4', border: '#86EFAC', text: '#047857' },
  decay:      { label: 'Decay/Caries', bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C' },
  filled:     { label: 'Filled',     bg: '#EFF6FF', border: '#93C5FD', text: '#2563EB' },
  crown:      { label: 'Crown',      bg: '#F5F3FF', border: '#C4B5FD', text: '#6D28D9' },
  root_canal: { label: 'Root Canal', bg: '#FDF2F8', border: '#F472B6', text: '#DB2777' },
  extracted:  { label: 'Missing',    bg: '#F8FAFC', border: '#CBD5E1', text: '#64748B' },
  implant:    { label: 'Implant',    bg: '#ECFEFF', border: '#67E8F9', text: '#0891B2' },
};

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface DentalPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

export function DentalPanel({ readonly = false }: DentalPanelProps) {
  const [teeth, setTeeth] = useState<Record<number, ToothState>>({
    16: { status: 'filled', notes: 'Composite restoration' },
    21: { status: 'crown', notes: 'Zirconia crown' },
    36: { status: 'decay', notes: 'Occlusal cavity' },
  });

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [modalStatus, setModalStatus] = useState<ToothState['status']>('healthy');
  const [modalNotes, setModalNotes] = useState<string>('');

  const handleToothClick = (toothNum: number) => {
    if (readonly) return;
    setSelectedTooth(toothNum);
    const existing = teeth[toothNum] || { status: 'healthy', notes: '' };
    setModalStatus(existing.status);
    setModalNotes(existing.notes || '');
  };

  const handleSaveTooth = () => {
    if (selectedTooth === null) return;
    setTeeth((prev) => ({
      ...prev,
      [selectedTooth]: {
        status: modalStatus,
        notes: modalNotes,
      },
    }));
    setSelectedTooth(null);
  };

  const renderTooth = (num: number) => {
    const data = teeth[num];
    const status = data ? data.status : 'healthy';
    const config = TOOTH_STATUS_CONFIG[status];
    const isSelected = selectedTooth === num;

    return (
      <div
        key={num}
        onClick={() => handleToothClick(num)}
        style={{
          width: 38,
          height: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          backgroundColor: config.bg,
          border: `1.5px solid ${isSelected ? '#2563EB' : config.border}`,
          cursor: readonly ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isSelected ? '0 0 0 2px #93C5FD' : 'none',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{num}</span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: config.text,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginTop: 4,
          }}
        >
          {status === 'healthy' ? 'OK' : status.slice(0, 3)}
        </span>
      </div>
    );
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#2563EB" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Interactive Odontogram (FDI 2D)</span>
          <Tag color="cyan" style={{ borderRadius: 6, fontSize: 11 }}>Dental Specialty</Tag>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
        {Object.entries(TOOTH_STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: cfg.border,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Odontogram Grid */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ minWidth: 640 }}>
          <Text style={{ fontSize: 11, color: '#64748B', display: 'block', textAlign: 'center', marginBottom: 6 }}>
            MAXILLARY (UPPER ARCH)
          </Text>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {UPPER_TEETH.map(renderTooth)}
          </div>

          <div style={{ height: 1, backgroundColor: '#E2E8F0', margin: '12px 0' }} />

          <Text style={{ fontSize: 11, color: '#64748B', display: 'block', textAlign: 'center', marginBottom: 6 }}>
            MANDIBULAR (LOWER ARCH)
          </Text>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {LOWER_TEETH.map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Tooth Edit Modal */}
      <Modal
        title={`Edit Tooth #${selectedTooth} Finding`}
        open={selectedTooth !== null}
        onCancel={() => setSelectedTooth(null)}
        onOk={handleSaveTooth}
        okText="Apply"
        width={420}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Clinical Condition</Text>
            <Radio.Group
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {Object.entries(TOOTH_STATUS_CONFIG).map(([key, cfg]) => (
                <Radio key={key} value={key}>
                  <Space direction="horizontal" size={6}>
                    <span style={{ color: cfg.text, fontWeight: 600 }}>{cfg.label}</span>
                  </Space>
                </Radio>
              ))}
            </Radio.Group>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Treatment Notes / Surfaces</Text>
            <Input
              placeholder="e.g. MOD cavity, requires root canal, porcelain crown"
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
