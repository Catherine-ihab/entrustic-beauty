import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { Activity, Plus } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import type { MeasurementTrend } from '@clinic/shared-types';
import {
  DEFAULT_VITAL_ORDER,
  VitalsTrendsGrid,
  vitalLabel,
} from './VitalsTrends';

const { Title, Text } = Typography;

interface PatientOption {
  id: string;
  label: string;
}

const UNIT_BY_KEY: Record<string, string> = {
  weight: 'kg',
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  heart_rate: 'bpm',
  temperature: '°C',
  spo2: '%',
  blood_glucose: 'mg/dL',
  pain_score: 'score',
};

const RANGE_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 },
  { label: 'All', value: 0 },
];

export function VitalsTrendsView() {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState<string | undefined>();
  const [days, setDays] = useState<number>(90);
  const [trends, setTrends] = useState<MeasurementTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(true);

  const [recordOpen, setRecordOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const patientIdRef = useRef<string | undefined>(undefined);
  patientIdRef.current = patientId;

  const loadTrends = async (id?: string, d = days) => {
    if (!id) {
      setTrends([]);
      return;
    }
    setLoading(true);
    try {
      const res: any = await apiClient.get(`/patients/${id}/measurements/trends?days=${d}`);
      setTrends(res.data ?? []);
    } catch {
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setPatientsLoading(true);
      try {
        const res: any = await apiClient.get('/patients?limit=100');
        const rows: any[] = res.data ?? [];
        const opts: PatientOption[] = rows.map((p) => ({
          id: p.id,
          label: `${p.first_name ?? ''} ${p.last_name ?? ''} · ${p.patient_number ?? p.id.slice(0, 8)}`.trim(),
        }));
        setPatients(opts);
        if (opts.length && !patientIdRef.current) {
          setPatientId(opts[0].id);
        }
      } catch {
        setPatients([]);
      } finally {
        setPatientsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void loadTrends(patientId, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, days]);

  const openRecord = () => {
    form.resetFields();
    const firstKey = DEFAULT_VITAL_ORDER[0];
    if (firstKey) form.setFieldsValue({ key: firstKey, unit: UNIT_BY_KEY[firstKey] ?? '' });
    setRecordOpen(true);
  };

  const submitRecord = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await apiClient.post(`/patients/${patientId}/measurements`, {
        key: values.key,
        value: values.value,
        unit: values.unit,
        notes: values.notes || undefined,
      });
      message.success('Measurement recorded');
      setRecordOpen(false);
      await loadTrends(patientId, days);
    } catch (e: any) {
      message.error(e?.errors?.[0]?.message ?? e?.message ?? 'Could not record measurement');
    } finally {
      setSaving(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={22} />
            Vitals & Trends
          </Title>
          <Text type="secondary">
            {selectedPatient ? `Showing ${selectedPatient.label}` : 'Select a patient to view recorded measurements'}
          </Text>
        </div>
        <Space wrap>
          <Select
            style={{ minWidth: 260 }}
            showSearch
            placeholder="Select patient"
            value={patientId}
            loading={patientsLoading}
            onChange={(v) => setPatientId(v)}
            options={patients.map((p) => ({ value: p.id, label: p.label }))}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
          <Segmented value={days} onChange={(v) => setDays(v as number)} options={RANGE_OPTIONS} />
          <Button type="primary" icon={<Plus size={15} />} disabled={!patientId} onClick={openRecord}>
            Record vitals
          </Button>
        </Space>
      </div>

      {!patientsLoading && !patients.length ? (
        <Text type="secondary">No patients found.</Text>
      ) : loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : patientId ? (
        <VitalsTrendsGrid trends={trends} />
      ) : null}

      <Modal
        title="Record vitals"
        open={recordOpen}
        onCancel={() => setRecordOpen(false)}
        onOk={submitRecord}
        okText="Save reading"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="key"
            label="Measurement"
            rules={[{ required: true, message: 'Choose a measurement' }]}
          >
            <Select
              onChange={(k: string) =>
                form.setFieldsValue({ unit: UNIT_BY_KEY[k] ?? form.getFieldValue('unit') })
              }
              options={DEFAULT_VITAL_ORDER.map((key) => ({
                value: key,
                label: vitalLabel(key),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Enter a numeric value' }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.1} />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: 'Unit is required' }]}
          >
            <Input maxLength={30} />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
