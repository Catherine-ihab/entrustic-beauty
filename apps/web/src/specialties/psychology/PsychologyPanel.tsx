import { useState } from 'react';
import { Card, Typography, Radio, Tag, Row, Col, Alert, Input } from 'antd';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things (reading, watching TV)',
  'Moving or speaking slowly, or fidgety/restless',
  'Thoughts that you would be better off dead or hurting yourself',
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const SCALE_OPTIONS = [
  { label: 'Not at all (0)', value: 0 },
  { label: 'Several days (1)', value: 1 },
  { label: 'More than half (2)', value: 2 },
  { label: 'Nearly every day (3)', value: 3 },
];

export function PsychologyPanel({ readonly = false }: SpecialtyComponentProps) {
  const [phqAnswers, setPhqAnswers] = useState<number[]>(new Array(9).fill(0));
  const [gadAnswers, setGadAnswers] = useState<number[]>(new Array(7).fill(0));
  const [mentalStatusExam, setMentalStatusExam] = useState<string>('');
  const [safetyPlan, setSafetyPlan] = useState<string>('');

  const phqTotal = phqAnswers.reduce((a, b) => a + b, 0);
  const gadTotal = gadAnswers.reduce((a, b) => a + b, 0);

  const getPhqSeverity = (score: number) => {
    if (score <= 4) return { label: 'Minimal / None (0–4)', color: 'green' };
    if (score <= 9) return { label: 'Mild (5–9)', color: 'blue' };
    if (score <= 14) return { label: 'Moderate (10–14)', color: 'gold' };
    if (score <= 19) return { label: 'Moderately Severe (15–19)', color: 'orange' };
    return { label: 'Severe (20–27)', color: 'red' };
  };

  const getGadSeverity = (score: number) => {
    if (score <= 4) return { label: 'Minimal Anxiety (0–4)', color: 'green' };
    if (score <= 9) return { label: 'Mild Anxiety (5–9)', color: 'blue' };
    if (score <= 14) return { label: 'Moderate Anxiety (10–14)', color: 'gold' };
    return { label: 'Severe Anxiety (15–21)', color: 'red' };
  };

  const phqSev = getPhqSeverity(phqTotal);
  const gadSev = getGadSeverity(gadTotal);
  const hasSuicidalIdeation = phqAnswers[8] > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hasSuicidalIdeation && (
        <Alert
          type="error"
          showIcon
          message="Clinical Alert: Suicidal Ideation Endorsed (PHQ-9 Item 9 > 0)"
          description="Immediate comprehensive risk assessment, safety planning, and lethal means restriction discussion are indicated."
          style={{ borderRadius: 8 }}
        />
      )}

      {/* Summary Score Bar */}
      <Card size="small">
        <Row gutter={[16, 8]} align="middle">
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ fontSize: 13 }}>PHQ-9 Depression Score:</Text>
              <Tag color={phqSev.color} style={{ fontSize: 13, padding: '2px 8px' }}>
                {phqTotal} / 27 · {phqSev.label}
              </Tag>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ fontSize: 13 }}>GAD-7 Anxiety Score:</Text>
              <Tag color={gadSev.color} style={{ fontSize: 13, padding: '2px 8px' }}>
                {gadTotal} / 21 · {gadSev.label}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* PHQ-9 Questionnaire */}
      <Card size="small" title="PHQ-9 Depression Assessment (Patient Health Questionnaire)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PHQ9_QUESTIONS.map((q, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 6,
                backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 12, flex: 1, paddingRight: 16 }}>
                {idx + 1}. {q}
              </Text>
              <Radio.Group
                size="small"
                value={phqAnswers[idx]}
                disabled={readonly}
                onChange={(e) => {
                  const updated = [...phqAnswers];
                  updated[idx] = e.target.value;
                  setPhqAnswers(updated);
                }}
              >
                {SCALE_OPTIONS.map((opt) => (
                  <Radio.Button key={opt.value} value={opt.value}>
                    {opt.value}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          ))}
        </div>
      </Card>

      {/* GAD-7 Questionnaire */}
      <Card size="small" title="GAD-7 Generalized Anxiety Disorder Scale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GAD7_QUESTIONS.map((q, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 6,
                backgroundColor: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 12, flex: 1, paddingRight: 16 }}>
                {idx + 1}. {q}
              </Text>
              <Radio.Group
                size="small"
                value={gadAnswers[idx]}
                disabled={readonly}
                onChange={(e) => {
                  const updated = [...gadAnswers];
                  updated[idx] = e.target.value;
                  setGadAnswers(updated);
                }}
              >
                {SCALE_OPTIONS.map((opt) => (
                  <Radio.Button key={opt.value} value={opt.value}>
                    {opt.value}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          ))}
        </div>
      </Card>

      {/* Mental Status & Safety Formulation */}
      <Card size="small" title="Mental Status Exam (MSE) &amp; Safety Planning">
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Mental Status Exam (Appearance, Affect, Thought Content, Insight)
            </Text>
            <TextArea
              rows={3}
              value={mentalStatusExam}
              onChange={(e) => setMentalStatusExam(e.target.value)}
              placeholder="Appearance well-groomed, mood euthymic, affect congruent, speech normal..."
              disabled={readonly}
            />
          </Col>
          <Col span={12}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Safety Plan &amp; Risk Formulation
            </Text>
            <TextArea
              rows={3}
              value={safetyPlan}
              onChange={(e) => setSafetyPlan(e.target.value)}
              placeholder="Warning signs identified, internal coping strategies, emergency contacts..."
              disabled={readonly}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
