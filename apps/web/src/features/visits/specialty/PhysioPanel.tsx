import { Card, Form, Input, Slider, Select, Row, Col, Tag } from 'antd';
import { Activity } from 'lucide-react';

interface PhysioPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

const MRC_STRENGTH_GRADES = [
  { value: 0, label: '0 - No contraction' },
  { value: 1, label: '1 - Trace contraction, no movement' },
  { value: 2, label: '2 - Movement with gravity eliminated' },
  { value: 3, label: '3 - Movement against gravity, no resistance' },
  { value: 4, label: '4 - Movement against moderate resistance' },
  { value: 5, label: '5 - Normal power against full resistance' },
];

const COMMON_JOINTS = [
  'Cervical Spine',
  'Lumbar Spine',
  'Shoulder (Right)',
  'Shoulder (Left)',
  'Elbow (Right)',
  'Elbow (Left)',
  'Wrist/Hand (Right)',
  'Wrist/Hand (Left)',
  'Hip (Right)',
  'Hip (Left)',
  'Knee (Right)',
  'Knee (Left)',
  'Ankle/Foot (Right)',
  'Ankle/Foot (Left)',
];

export function PhysioPanel({ readonly = false }: PhysioPanelProps) {
  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#059669" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Physiotherapy & Functional Assessment</span>
          <Tag color="green" style={{ borderRadius: 6, fontSize: 11 }}>Physio & Rehab</Tag>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Target Joint / Region" style={{ marginBottom: 12 }}>
              <Select
                placeholder="Select region assessed"
                options={COMMON_JOINTS.map((j) => ({ label: j, value: j }))}
                disabled={readonly}
                defaultValue="Knee (Right)"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Muscle Strength Grade (MRC Scale)" style={{ marginBottom: 12 }}>
              <Select
                options={MRC_STRENGTH_GRADES}
                disabled={readonly}
                defaultValue={4}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Pain Score (VAS 0 - 10)" style={{ marginBottom: 12 }}>
              <div style={{ padding: '0 8px' }}>
                <Slider
                  min={0}
                  max={10}
                  marks={{
                    0: '0 (None)',
                    5: '5 (Mod)',
                    10: '10 (Severe)',
                  }}
                  defaultValue={6}
                  disabled={readonly}
                />
              </div>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Range of Motion (ROM degrees)" style={{ marginBottom: 12 }}>
              <Input
                placeholder="e.g. Flexion: 95° (Normal 135°), Extension: -5°"
                disabled={readonly}
                defaultValue="Flexion: 90°, Extension: 0°"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Manual Therapy & Modalities Performed Today" style={{ marginBottom: 12 }}>
          <Input.TextArea
            rows={2}
            placeholder="e.g. Deep tissue friction, passive joint mobilization Grade III, ultrasound therapy 1.5W/cm² 8 min"
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item label="Prescribed Home Exercise Program (HEP)" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={2}
            placeholder="e.g. Straight leg raises 3x10 reps, quadriceps sets, hamstring stretch 30s holds twice daily"
            disabled={readonly}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
