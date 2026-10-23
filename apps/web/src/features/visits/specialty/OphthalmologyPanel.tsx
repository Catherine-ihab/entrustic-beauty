import { Card, Form, Input, Row, Col, Tag, Typography, Select } from 'antd';
import { Eye } from 'lucide-react';

const { Text } = Typography;

interface OphthalmologyPanelProps {
  visitId?: string;
  patientId?: string;
  readonly?: boolean;
}

const VA_OPTIONS = [
  '6/6 (20/20)',
  '6/9 (20/30)',
  '6/12 (20/40)',
  '6/18 (20/60)',
  '6/24 (20/80)',
  '6/36 (20/120)',
  '6/60 (20/200)',
  'CF (Counting Fingers)',
  'HM (Hand Motion)',
  'LP (Light Perception)',
  'NLP (No Light Perception)',
];

export function OphthalmologyPanel({ readonly = false }: OphthalmologyPanelProps) {
  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={16} color="#0369A1" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Per-Eye Ophthalmic Examination (OD / OS)</span>
          <Tag color="geekblue" style={{ borderRadius: 6, fontSize: 11 }}>Ophthalmology</Tag>
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Form layout="vertical">
        <Row gutter={24}>
          {/* OD (Right Eye) */}
          <Col xs={24} md={12}>
            <div
              style={{
                padding: '14px',
                borderRadius: 10,
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text strong style={{ color: '#0369A1', fontSize: 13 }}>
                  OD — RIGHT EYE (Oculus Dexter)
                </Text>
                <Tag color="blue">OD</Tag>
              </div>

              <Row gutter={10}>
                <Col span={12}>
                  <Form.Item label="Visual Acuity (Uncorrected)" style={{ marginBottom: 10 }}>
                    <Select defaultValue="6/6 (20/20)" options={VA_OPTIONS.map((v) => ({ label: v, value: v }))} disabled={readonly} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Intraocular Pressure (IOP)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="15 mmHg" disabled={readonly} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={10}>
                <Col span={8}>
                  <Form.Item label="Sphere (DS)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="-1.25" disabled={readonly} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Cylinder (DC)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="-0.50" disabled={readonly} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Axis (°)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="90°" disabled={readonly} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Slit Lamp (Cornea / Anterior Chamber / Lens)" style={{ marginBottom: 10 }}>
                <Input.TextArea rows={2} defaultValue="Cornea clear, anterior chamber deep and quiet, lens transparent." disabled={readonly} />
              </Form.Item>

              <Form.Item label="Fundoscopy & Retina (OD)" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={2} defaultValue="Optic disc sharp margins, C/D ratio 0.3, macula healthy, retina flat." disabled={readonly} />
              </Form.Item>
            </div>
          </Col>

          {/* OS (Left Eye) */}
          <Col xs={24} md={12}>
            <div
              style={{
                padding: '14px',
                borderRadius: 10,
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text strong style={{ color: '#334155', fontSize: 13 }}>
                  OS — LEFT EYE (Oculus Sinister)
                </Text>
                <Tag>OS</Tag>
              </div>

              <Row gutter={10}>
                <Col span={12}>
                  <Form.Item label="Visual Acuity (Uncorrected)" style={{ marginBottom: 10 }}>
                    <Select defaultValue="6/9 (20/30)" options={VA_OPTIONS.map((v) => ({ label: v, value: v }))} disabled={readonly} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Intraocular Pressure (IOP)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="16 mmHg" disabled={readonly} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={10}>
                <Col span={8}>
                  <Form.Item label="Sphere (DS)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="-1.50" disabled={readonly} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Cylinder (DC)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="-0.25" disabled={readonly} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Axis (°)" style={{ marginBottom: 10 }}>
                    <Input defaultValue="85°" disabled={readonly} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Slit Lamp (Cornea / Anterior Chamber / Lens)" style={{ marginBottom: 10 }}>
                <Input.TextArea rows={2} defaultValue="Cornea clear, quiet anterior chamber, clear lens." disabled={readonly} />
              </Form.Item>

              <Form.Item label="Fundoscopy & Retina (OS)" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={2} defaultValue="Optic disc normal, C/D ratio 0.3, vessels intact, macula clear." disabled={readonly} />
              </Form.Item>
            </div>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
