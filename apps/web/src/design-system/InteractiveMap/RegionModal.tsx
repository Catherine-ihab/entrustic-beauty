import { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Radio, Space } from 'antd';
import { MapRegion, RegionState, StatusConfig } from './types';

interface RegionModalProps {
  region: MapRegion | null;
  currentState?: RegionState;
  statusConfig: Record<string, StatusConfig>;
  open: boolean;
  onCancel: () => void;
  onSave: (regionId: string, state: RegionState) => void;
  extraFields?: 'aesthetic' | 'dermatology' | 'orthopedic';
}

export function RegionModal({
  region,
  currentState,
  statusConfig,
  open,
  onCancel,
  onSave,
  extraFields,
}: RegionModalProps) {
  const [form] = Form.useForm();
  const [selectedStatus, setSelectedStatus] = useState<string>('treated');

  useEffect(() => {
    if (region && open) {
      const initialStatus = currentState?.status || Object.keys(statusConfig)[0] || 'treated';
      setSelectedStatus(initialStatus);
      form.setFieldsValue({
        status: initialStatus,
        notes: currentState?.notes || '',
        units: currentState?.details?.units || '',
        product: currentState?.details?.product || '',
        severity: currentState?.details?.severity || 'mild',
      });
    }
  }, [region, currentState, open, form, statusConfig]);

  if (!region) return null;

  const handleOk = async () => {
    const values = await form.validateFields();
    onSave(region.id, {
      status: values.status,
      notes: values.notes,
      details: {
        units: values.units,
        product: values.product,
        severity: values.severity,
      },
    });
    onCancel();
  };

  return (
    <Modal
      title={
        <div>
          <span>{region.label}</span>
          {region.group && (
            <span style={{ fontSize: 12, color: '#64748B', marginInlineStart: 8, fontWeight: 400 }}>
              ({region.group})
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Apply Finding"
      width={440}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="status" label="Clinical Status" rules={[{ required: true }]}>
          <Radio.Group
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <Radio key={key} value={key}>
                <Space size={6}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: cfg.bg,
                      border: `1.5px solid ${cfg.color}`,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                </Space>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {extraFields === 'aesthetic' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Form.Item name="product" label="Product / Batch">
              <Input placeholder="e.g. Juvederm Ultra / Botox" />
            </Form.Item>
            <Form.Item name="units" label="Units / Volume (ml)">
              <Input placeholder="e.g. 0.5 ml / 4 Units" />
            </Form.Item>
          </div>
        )}

        {extraFields === 'dermatology' && (
          <Form.Item name="severity" label="Lesion Severity">
            <Select
              options={[
                { value: 'mild', label: 'Mild / Superficial' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'severe', label: 'Severe / Deep' },
              ]}
            />
          </Form.Item>
        )}

        <Form.Item name="notes" label="Clinical Observations & Technique">
          <Input.TextArea rows={3} placeholder="Notes, injection plane, or findings..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
