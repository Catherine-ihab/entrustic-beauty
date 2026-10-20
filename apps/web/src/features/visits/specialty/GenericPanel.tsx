import { Form, Input, Card, Select, Tag } from 'antd';
import { Stethoscope } from 'lucide-react';

interface GenericPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

const BODY_SYSTEMS = [
  'General / Constitutional',
  'Cardiovascular',
  'Respiratory',
  'Gastrointestinal',
  'Musculoskeletal',
  'Neurological',
  'Dermatological',
  'Endocrine',
  'Psychiatric',
  'ENT & Head/Neck',
];

export function GenericPanel({ readonly = false }: GenericPanelProps) {
  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stethoscope size={16} color="#2563EB" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Clinical Assessment & Examination</span>
          <Tag color="blue" style={{ borderRadius: 6, fontSize: 11 }}>General Specialty</Tag>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Form layout="vertical">
        <Form.Item label="Target System / Region Examined" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="Select body system(s) examined"
            options={BODY_SYSTEMS.map((s) => ({ label: s, value: s }))}
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item label="Physical Examination Findings" style={{ marginBottom: 12 }}>
          <Input.TextArea
            rows={3}
            placeholder="Document physical examination observations, palpation, auscultation, or inspection findings..."
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item label="Clinical Impression & Assessment" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={2}
            placeholder="Doctor's clinical differential assessment or diagnostic rationale..."
            disabled={readonly}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
