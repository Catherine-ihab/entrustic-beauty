import { useState, type ReactNode } from 'react';
import { Button, Card, Form, Input, InputNumber, Select, Tag, Typography } from 'antd';
import { Sparkles } from 'lucide-react';
import type { SpecialtyComponentProps, SpecialtyModuleConfig } from './types';

const { Text } = Typography;

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

interface BasicWorkspaceProps extends SpecialtyComponentProps {
  config: SpecialtyModuleConfig;
  icon?: ReactNode;
}

/**
 * Generic, config-driven specialty workspace used by specialties that do not
 * have a dedicated visualizer yet (General Medicine, Pediatrics, Gynecology).
 * Renders the specialty identity + specialty measurements + quick templates
 * on top of a full clinical assessment form.
 */
export function BasicWorkspace({ config, icon, readonly = false }: BasicWorkspaceProps) {
  const [form] = Form.useForm();
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  const applyTemplate = (name: string, chiefComplaint?: string, diagnosis?: string, plan?: string) => {
    form.setFieldsValue({
      chiefComplaint: chiefComplaint ?? '',
      clinicalImpression: diagnosis ?? '',
      treatmentPlan: plan ?? '',
    });
    setAppliedTemplate(name);
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: config.themeColor, display: 'flex' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{config.nameEn}</span>
          <Tag color={config.themeColor} style={{ borderRadius: 6, fontSize: 11, color: '#FFF' }}>
            {config.nameAr}
          </Tag>
        </div>
      }
      style={{ borderRadius: 12, border: `1px solid #E2E8F0`, marginBottom: 16 }}
    >
      <div style={{ marginBottom: 14 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {config.taglineEn}
        </Text>
      </div>

      <Form form={form} layout="vertical">
        {/* Specialty measurements */}
        {config.measurements.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 6,
            }}
          >
            {config.measurements.map((m) => (
              <Form.Item key={m.key} label={`${m.label}${m.unit ? ` (${m.unit})` : ''}`} style={{ marginBottom: 8 }}>
                {m.type === 'select' ? (
                  <Select
                    placeholder="Select..."
                    defaultValue={m.defaultValue}
                    options={(m.options ?? []).map((o) => ({ label: o, value: o }))}
                    disabled={readonly}
                  />
                ) : m.type === 'number' ? (
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder={m.unit}
                    defaultValue={m.defaultValue}
                    disabled={readonly}
                  />
                ) : (
                  <Input placeholder={m.unit} defaultValue={m.defaultValue} disabled={readonly} />
                )}
              </Form.Item>
            ))}
          </div>
        )}

        <Form.Item label="Target System / Region Examined" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="Select body system(s) examined"
            options={BODY_SYSTEMS.map((s) => ({ label: s, value: s }))}
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item name="chiefComplaint" label="Chief Complaint" style={{ marginBottom: 12 }}>
          <Input placeholder="Primary reason for today's visit..." disabled={readonly} />
        </Form.Item>

        <Form.Item name="examFindings" label="Physical Examination Findings" style={{ marginBottom: 12 }}>
          <Input.TextArea
            rows={3}
            placeholder="Document physical examination observations, palpation, auscultation, or inspection findings..."
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item name="clinicalImpression" label="Clinical Impression & Assessment" style={{ marginBottom: 12 }}>
          <Input.TextArea
            rows={2}
            placeholder="Doctor's clinical differential assessment or diagnostic rationale..."
            disabled={readonly}
          />
        </Form.Item>

        <Form.Item name="treatmentPlan" label="Treatment Plan" style={{ marginBottom: config.quickTemplates.length ? 12 : 0 }}>
          <Input.TextArea
            rows={2}
            placeholder="Therapeutics, referrals, patient education and follow-up plan..."
            disabled={readonly}
          />
        </Form.Item>

        {/* Quick documentation templates */}
        {config.quickTemplates.length > 0 && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={14} color={config.themeColor} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Quick Templates</span>
              {appliedTemplate && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  — applied: {appliedTemplate}
                </Text>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {config.quickTemplates.map((t) => (
                <Button
                  key={t.name}
                  size="small"
                  type={appliedTemplate === t.name ? 'primary' : 'default'}
                  style={{ borderRadius: 8 }}
                  disabled={readonly}
                  onClick={() => applyTemplate(t.name, t.chiefComplaint, t.diagnosis, t.plan)}
                >
                  {t.category ? `${t.category}: ` : ''}
                  {t.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Form>
    </Card>
  );
}
