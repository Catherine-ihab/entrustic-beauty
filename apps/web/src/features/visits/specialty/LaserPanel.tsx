import { Card, Form, Input, InputNumber, Row, Col, Select, Tag } from 'antd';
import { Zap } from 'lucide-react';

interface LaserPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

const COMMON_AREAS = [
  'Full Face',
  'Upper Lip & Chin',
  'Underarms',
  'Full Arms',
  'Full Legs',
  'Half Legs',
  'Bikini Line',
  'Back',
  'Chest',
];

export function LaserPanel({ readonly = false }: LaserPanelProps) {
  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="#D97706" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Laser Parameters & Session Log</span>
          <Tag color="gold" style={{ borderRadius: 6, fontSize: 11 }}>Laser & Aesthetic</Tag>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Treatment Area" style={{ marginBottom: 12 }}>
              <Select
                placeholder="Select treated area"
                options={COMMON_AREAS.map((a) => ({ label: a, value: a }))}
                disabled={readonly}
                defaultValue="Full Face"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item label="Session #" style={{ marginBottom: 12 }}>
              <InputNumber min={1} style={{ width: '100%' }} defaultValue={3} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item label="Passes" style={{ marginBottom: 12 }}>
              <InputNumber min={1} style={{ width: '100%' }} defaultValue={2} disabled={readonly} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Form.Item label="Fluence (J/cm²)" style={{ marginBottom: 12 }}>
              <InputNumber min={1} step={0.5} style={{ width: '100%' }} defaultValue={14} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Pulse Duration (ms)" style={{ marginBottom: 12 }}>
              <InputNumber min={1} style={{ width: '100%' }} defaultValue={25} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Spot Size (mm)" style={{ marginBottom: 12 }}>
              <InputNumber min={1} style={{ width: '100%' }} defaultValue={15} disabled={readonly} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Cooling Mode" style={{ marginBottom: 12 }}>
              <Select
                defaultValue="Cryo Dynamic Cooling (-15°C)"
                options={[
                  { value: 'Cryo Dynamic Cooling (-15°C)', label: 'Cryo Dynamic (-15°C)' },
                  { value: 'Contact Sapphire Tip', label: 'Sapphire Tip' },
                  { value: 'Air Chiller (Zimmer)', label: 'Zimmer Air Chiller' },
                  { value: 'Topical Ice Pack', label: 'Ice Pack' },
                ]}
                disabled={readonly}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Immediate Skin Response" style={{ marginBottom: 12 }}>
              <Input
                placeholder="e.g. Mild erythema and perifollicular edema, resolved after 15 min"
                disabled={readonly}
                defaultValue="Mild peri-follicular erythema, well tolerated"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Next Recommended Session" style={{ marginBottom: 12 }}>
              <Select
                defaultValue="After 4 weeks"
                options={[
                  { value: 'After 2 weeks', label: 'After 2 weeks' },
                  { value: 'After 3 weeks', label: 'After 3 weeks' },
                  { value: 'After 4 weeks', label: 'After 4 weeks' },
                  { value: 'After 6 weeks', label: 'After 6 weeks' },
                  { value: 'After 8 weeks', label: 'After 8 weeks' },
                ]}
                disabled={readonly}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
