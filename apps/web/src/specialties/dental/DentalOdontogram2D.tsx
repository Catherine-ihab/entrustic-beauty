import { useState } from 'react';
import { Card, Tag, Space, Typography, Modal, Radio, Input, Segmented } from 'antd';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

// Adult FDI Teeth (32 Teeth)
const ADULT_UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Pediatric FDI Primary Teeth (20 Teeth: 55-51, 61-65, 85-81, 71-75)
const PEDO_UPPER_TEETH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const PEDO_LOWER_TEETH = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

export type ToothProcedure =
  | 'healthy'
  | 'caries'
  | 'filling'
  | 'root_canal'
  | 'crown'
  | 'extracted'
  | 'cleaning'
  | 'implant';

export interface ToothRecord {
  fdiNumber: number;
  status: ToothProcedure;
  notes?: string;
}

const PROCEDURE_MAP: Record<ToothProcedure, { labelEn: string; labelAr: string; color: string; short: string }> = {
  healthy:    { labelEn: 'Sound / Healthy',     labelAr: 'سليم',         color: '#047857', short: 'سليم' },
  caries:     { labelEn: 'Active Caries',       labelAr: 'تسوس نشط',     color: '#B91C1C', short: 'تسوس' },
  filling:    { labelEn: 'Restoration / Filling', labelAr: 'حشو عادي',     color: '#2563EB', short: 'حشو' },
  root_canal: { labelEn: 'Root Canal (Endo)',   labelAr: 'حشو عصب',      color: '#9333EA', short: 'عصب' },
  crown:      { labelEn: 'Crown / Prosthesis',  labelAr: 'تركيبة / طربوش', color: '#F59E0B', short: 'تركيبة' },
  extracted:  { labelEn: 'Missing / Extracted', labelAr: 'مخلوع / مفقود', color: '#64748B', short: 'خلع' },
  cleaning:   { labelEn: 'Scaling & Cleaning',  labelAr: 'تنظيف جير',    color: '#06B6D4', short: 'تنظيف' },
  implant:    { labelEn: 'Dental Implant',      labelAr: 'زراعة أسنان',   color: '#EC4899', short: 'زراعة' },
};

export function DentalOdontogram2D({ readonly = false, onStateChange }: SpecialtyComponentProps) {
  const [chartType, setChartType] = useState<'adult' | 'pediatric'>('adult');
  const [teeth, setTeeth] = useState<Record<number, ToothRecord>>({
    16: { fdiNumber: 16, status: 'caries', notes: 'Mesial caries' },
    24: { fdiNumber: 24, status: 'filling', notes: 'Composite restoration' },
    36: { fdiNumber: 36, status: 'root_canal', notes: 'Root canal + post' },
    46: { fdiNumber: 46, status: 'crown', notes: 'Zirconia crown' },
    48: { fdiNumber: 48, status: 'extracted', notes: 'Surgically extracted' },
  });

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<ToothProcedure>('healthy');
  const [editNotes, setEditNotes] = useState<string>('');

  const upperList = chartType === 'adult' ? ADULT_UPPER_TEETH : PEDO_UPPER_TEETH;
  const lowerList = chartType === 'adult' ? ADULT_LOWER_TEETH : PEDO_LOWER_TEETH;

  const handleToothClick = (fdi: number) => {
    setSelectedTooth(fdi);
    const curr = teeth[fdi] || { fdiNumber: fdi, status: 'healthy' };
    setEditStatus(curr.status);
    setEditNotes(curr.notes || '');
    if (!readonly) setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedTooth) return;
    const updated = {
      ...teeth,
      [selectedTooth]: {
        fdiNumber: selectedTooth,
        status: editStatus,
        notes: editNotes,
      },
    };
    setTeeth(updated);
    if (onStateChange) onStateChange(updated);
    setModalOpen(false);
  };

  const renderTooth = (fdi: number) => {
    const record = teeth[fdi] || { fdiNumber: fdi, status: 'healthy' };
    const proc = PROCEDURE_MAP[record.status] || PROCEDURE_MAP.healthy;

    return (
      <div
        key={fdi}
        onClick={() => handleToothClick(fdi)}
        style={{
          width: chartType === 'adult' ? 38 : 46,
          height: 58,
          borderRadius: 8,
          border: `2px solid ${proc.color}`,
          backgroundColor: `${proc.color}15`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 2px',
          cursor: readonly ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: record.status !== 'healthy' ? `0 2px 6px ${proc.color}30` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!readonly) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 6px 14px ${proc.color}45`;
          }
        }}
        onMouseLeave={(e) => {
          if (!readonly) {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = record.status !== 'healthy' ? `0 2px 6px ${proc.color}30` : 'none';
          }
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>{fdi}</span>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: proc.color,
          }}
        />
        <span style={{ fontSize: 10, fontWeight: 600, color: proc.color }}>
          {proc.short}
        </span>
      </div>
    );
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Space>
            <span style={{ fontWeight: 700, fontSize: 13 }}>مخطط الأسنان التفاعلي (FDI Odontogram)</span>
            <Tag color={chartType === 'adult' ? 'blue' : 'purple'}>
              {chartType === 'adult' ? '32 ضرس (بالغين)' : '20 ضرس (أطفال)'}
            </Tag>
          </Space>
          <Segmented
            value={chartType}
            onChange={(val) => setChartType(val as any)}
            options={[
              { label: 'أسنان بالغة (32)', value: 'adult' },
              { label: 'أسنان لبنية (20)', value: 'pediatric' },
            ]}
          />
        </div>
      }
    >
      {/* Legend */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, justifyContent: 'center' }}>
        {(Object.keys(PROCEDURE_MAP) as ToothProcedure[]).map((key) => {
          const item = PROCEDURE_MAP[key];
          return (
            <Tag
              key={key}
              style={{
                borderRadius: 6,
                padding: '2px 8px',
                border: `1px solid ${item.color}50`,
                backgroundColor: `${item.color}15`,
                color: item.color,
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              ● {item.labelAr} ({item.labelEn})
            </Tag>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '6px 0' }}>
        {/* Upper Arch */}
        <div>
          <Text strong style={{ fontSize: 12, display: 'block', textAlign: 'center', marginBottom: 6, color: '#64748B' }}>
            الفك العلوي (Maxilla) · يمين &larr; &rarr; يسار
          </Text>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {upperList.map(renderTooth)}
          </div>
        </div>

        <div style={{ width: '85%', height: 1, backgroundColor: '#E2E8F0' }} />

        {/* Lower Arch */}
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {lowerList.map(renderTooth)}
          </div>
          <Text strong style={{ fontSize: 12, display: 'block', textAlign: 'center', marginTop: 6, color: '#64748B' }}>
            الفك السفلي (Mandible) · يمين &larr; &rarr; يسار
          </Text>
        </div>
      </div>

      {/* Tooth Edit Modal */}
      <Modal
        title={`تشخيص وإجراء السن FDI #${selectedTooth}`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ الإجراء"
        cancelText="إلغاء"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          <Text strong style={{ fontSize: 13 }}>اختر حالة / إجراء السن:</Text>
          <Radio.Group value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(Object.keys(PROCEDURE_MAP) as ToothProcedure[]).map((key) => {
                const item = PROCEDURE_MAP[key];
                return (
                  <Radio key={key} value={key}>
                    <Space>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                        }}
                      />
                      <strong>{item.labelAr}</strong>
                      <span style={{ color: '#64748B', fontSize: 12 }}>({item.labelEn})</span>
                    </Space>
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>

          <Input.TextArea
            placeholder="ملاحظات إكلينيكية (مثال: حشو عصب 3 قنوات، تسوس في الجانب الأمامي، خلع جراحي...)"
            rows={2}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
        </div>
      </Modal>
    </Card>
  );
}
