import { useState } from 'react';
import { Card, Typography, Row, Col, Radio, Input, Select, Tag, Space, Table, InputNumber } from 'antd';
import type { SpecialtyPanelProps } from './registry';

const { Text } = Typography;
const { TextArea } = Input;

interface AudiogramPoint {
  frequency: number;
  rightEarDb: number | null;
  leftEarDb: number | null;
}

const DEFAULT_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

export function ENTPanel({ readonly = false }: SpecialtyPanelProps) {
  // Otoscopy findings
  const [rightTm, setRightTm] = useState<string>('intact');
  const [leftTm, setLeftTm] = useState<string>('intact');
  const [rinneTest, setRinneTest] = useState<string>('positive');
  const [weberTest, setWeberTest] = useState<string>('midline');

  // Rhinoscopy / Nasopharynx
  const [septum, setSeptum] = useState<string>('midline');
  const [turbinates, setTurbinates] = useState<string>('normal');

  // Pharynx / Larynx
  const [tonsilGrade, setTonsilGrade] = useState<string>('1');
  const [pharynxNotes, setPharynxNotes] = useState<string>('');

  // Audiogram pure tone threshold data
  const [audioData, setAudioData] = useState<AudiogramPoint[]>(
    DEFAULT_FREQUENCIES.map((f) => ({ frequency: f, rightEarDb: 15, leftEarDb: 15 }))
  );

  const handleAudioChange = (freq: number, ear: 'rightEarDb' | 'leftEarDb', val: number | null) => {
    setAudioData((prev) =>
      prev.map((row) => (row.frequency === freq ? { ...row, [ear]: val } : row))
    );
  };

  const columns = [
    {
      title: 'Freq (Hz)',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (v: number) => <Text strong>{v >= 1000 ? `${v / 1000}k` : `${v}`} Hz</Text>,
    },
    {
      title: 'Right Ear (dB HL)',
      dataIndex: 'rightEarDb',
      key: 'rightEarDb',
      render: (_: any, r: AudiogramPoint) =>
        readonly ? (
          <Text>{r.rightEarDb ?? '—'} dB</Text>
        ) : (
          <InputNumber
            min={-10}
            max={120}
            step={5}
            value={r.rightEarDb}
            onChange={(val) => handleAudioChange(r.frequency, 'rightEarDb', val)}
            size="small"
            addonAfter="dB"
          />
        ),
    },
    {
      title: 'Left Ear (dB HL)',
      dataIndex: 'leftEarDb',
      key: 'leftEarDb',
      render: (_: any, r: AudiogramPoint) =>
        readonly ? (
          <Text>{r.leftEarDb ?? '—'} dB</Text>
        ) : (
          <InputNumber
            min={-10}
            max={120}
            step={5}
            value={r.leftEarDb}
            onChange={(val) => handleAudioChange(r.frequency, 'leftEarDb', val)}
            size="small"
            addonAfter="dB"
          />
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Otology Card */}
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Otological Examination (Ears)</span>
            <Space>
              <Tag color="blue">R: {rightTm.toUpperCase()}</Tag>
              <Tag color="cyan">L: {leftTm.toUpperCase()}</Tag>
            </Space>
          </div>
        }
      >
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Right Tympanic Membrane (AD)
            </Text>
            <Radio.Group
              size="small"
              value={rightTm}
              onChange={(e) => setRightTm(e.target.value)}
              disabled={readonly}
            >
              <Radio.Button value="intact">Intact</Radio.Button>
              <Radio.Button value="retracted">Retracted</Radio.Button>
              <Radio.Button value="perforation">Perforation</Radio.Button>
              <Radio.Button value="effusion">Effusion</Radio.Button>
            </Radio.Group>
          </Col>

          <Col span={12}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Left Tympanic Membrane (AS)
            </Text>
            <Radio.Group
              size="small"
              value={leftTm}
              onChange={(e) => setLeftTm(e.target.value)}
              disabled={readonly}
            >
              <Radio.Button value="intact">Intact</Radio.Button>
              <Radio.Button value="retracted">Retracted</Radio.Button>
              <Radio.Button value="perforation">Perforation</Radio.Button>
              <Radio.Button value="effusion">Effusion</Radio.Button>
            </Radio.Group>
          </Col>

          <Col span={12}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Rinne Tuning Fork (512 Hz)
            </Text>
            <Radio.Group
              size="small"
              value={rinneTest}
              onChange={(e) => setRinneTest(e.target.value)}
              disabled={readonly}
            >
              <Radio.Button value="positive">Positive (AC &gt; BC · Normal)</Radio.Button>
              <Radio.Button value="negative_right">Neg (R · Conductive)</Radio.Button>
              <Radio.Button value="negative_left">Neg (L · Conductive)</Radio.Button>
            </Radio.Group>
          </Col>

          <Col span={12}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Weber Tuning Fork (512 Hz)
            </Text>
            <Radio.Group
              size="small"
              value={weberTest}
              onChange={(e) => setWeberTest(e.target.value)}
              disabled={readonly}
            >
              <Radio.Button value="midline">Midline (Normal)</Radio.Button>
              <Radio.Button value="lateralize_right">Lateralized Right</Radio.Button>
              <Radio.Button value="lateralize_left">Lateralized Left</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* Rhinology & Laryngology Card */}
      <Card size="small" title="Rhinology &amp; Laryngology (Nose &amp; Throat)">
        <Row gutter={[16, 12]}>
          <Col span={8}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Nasal Septum
            </Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={septum}
              onChange={setSeptum}
              disabled={readonly}
              options={[
                { value: 'midline', label: 'Midline / Normal' },
                { value: 'deviated_right', label: 'Deviated Right (DNS)' },
                { value: 'deviated_left', label: 'Deviated Left (DNS)' },
                { value: 'spur', label: 'Septal Spur' },
                { value: 'perforation', label: 'Perforation' },
              ]}
            />
          </Col>

          <Col span={8}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Turbinates
            </Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={turbinates}
              onChange={setTurbinates}
              disabled={readonly}
              options={[
                { value: 'normal', label: 'Normal / Eutrophic' },
                { value: 'hypertrophy_mild', label: 'Mild Hypertrophy' },
                { value: 'hypertrophy_severe', label: 'Severe Hypertrophy' },
                { value: 'pale_edematous', label: 'Pale / Edematous (Allergic)' },
              ]}
            />
          </Col>

          <Col span={8}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Tonsil Brodsky Grade
            </Text>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={tonsilGrade}
              onChange={setTonsilGrade}
              disabled={readonly}
              options={[
                { value: '0', label: 'Grade 0 (Tonsillectomy)' },
                { value: '1', label: 'Grade 1 (&lt; 25% airway)' },
                { value: '2', label: 'Grade 2 (25–50% airway)' },
                { value: '3', label: 'Grade 3 (50–75% airway)' },
                { value: '4', label: 'Grade 4 (&gt; 75% kissing)' },
              ]}
            />
          </Col>

          <Col span={24}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Endoscopic / Clinical Notes
            </Text>
            <TextArea
              rows={2}
              value={pharynxNotes}
              onChange={(e) => setPharynxNotes(e.target.value)}
              placeholder="Vocal cords mobility, mucosal lesions, adenoid tissue status..."
              disabled={readonly}
            />
          </Col>
        </Row>
      </Card>

      {/* Pure-Tone Audiometry Matrix */}
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Pure-Tone Audiometry Screening (PTA)</span>
            <Tag color="purple">Auditory Threshold Matrix</Tag>
          </div>
        }
      >
        <Table
          dataSource={audioData}
          columns={columns}
          rowKey="frequency"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
