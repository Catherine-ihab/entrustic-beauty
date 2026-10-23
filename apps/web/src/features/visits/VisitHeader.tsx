import { Button, Tag, Space, Typography, Card } from 'antd';
import { ArrowLeft, Save, CheckCircle2, ShieldAlert, MessageSquare } from 'lucide-react';

const { Title, Text } = Typography;

interface VisitHeaderProps {
  patient: {
    id: string;
    patientNumber: string;
    fullName: string;
    gender?: string;
    age?: string;
    bloodType?: string;
  };
  visitNumber?: number;
  status: string;
  allergies?: Array<{ allergen: string; severity: string }>;
  conditions?: Array<{ name: string; severity?: string }>;
  isPregnant?: boolean;
  doctorName?: string;
  onBack: () => void;
  onSaveDraft?: () => void;
  onFinalize?: () => void;
  onSendWhatsApp?: () => void;
  saving?: boolean;
}

export function VisitHeader({
  patient,
  visitNumber = 1,
  status,
  allergies = [],
  conditions = [],
  isPregnant = false,
  doctorName,
  onBack,
  onSaveDraft,
  onFinalize,
  onSendWhatsApp,
  saving = false,
}: VisitHeaderProps) {
  const hasLifeThreatening = allergies.some((a) => a.severity === 'life_threatening');
  const hasAlerts = allergies.length > 0 || conditions.length > 0 || isPregnant;

  return (
    <Card
      style={{
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Left: Patient Identity & Visit Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button
            icon={<ArrowLeft size={16} />}
            type="text"
            onClick={onBack}
            style={{ color: '#64748B' }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
                {patient.fullName}
              </Title>
              <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600, borderRadius: 6 }}>
                {patient.patientNumber}
              </Tag>
              <Tag color={status === 'finalized' ? 'green' : 'orange'} style={{ borderRadius: 6 }}>
                Visit #{visitNumber} · {status.toUpperCase()}
              </Tag>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              {patient.gender && (
                <Text style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>
                  {patient.gender} {patient.age ? `· ${patient.age}` : ''}
                </Text>
              )}
              {patient.bloodType && (
                <Tag color="red" style={{ fontSize: 11, padding: '0 6px', margin: 0, borderRadius: 4 }}>
                  {patient.bloodType}
                </Tag>
              )}
              {doctorName && (
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  Attending: <strong style={{ color: '#334155' }}>{doctorName}</strong>
                </Text>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <Space>
          {onSaveDraft && (
            <Button
              icon={<Save size={15} />}
              onClick={onSaveDraft}
              loading={saving}
              style={{ borderRadius: 8, height: 38 }}
            >
              Save Draft
            </Button>
          )}
          {onSendWhatsApp && (
            <Button
              style={{
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#FFFFFF',
                borderRadius: 8,
                height: 38,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              icon={<MessageSquare size={15} />}
              onClick={onSendWhatsApp}
            >
              WhatsApp Notes
            </Button>
          )}
          {onFinalize && (
            <Button
              type="primary"
              icon={<CheckCircle2 size={15} />}
              onClick={onFinalize}
              loading={saving}
              style={{ borderRadius: 8, height: 38, fontWeight: 500 }}
            >
              Finalize & Sign Visit
            </Button>
          )}
        </Space>
      </div>

      {/* Inline Medical Alert Banner if any alerts exist */}
      {hasAlerts && (
        <div
          style={{
            marginTop: 14,
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: hasLifeThreatening || isPregnant ? '#FEF2F2' : '#FFFBEB',
            border: `1px solid ${hasLifeThreatening || isPregnant ? '#FECACA' : '#FDE68A'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <ShieldAlert size={16} color={hasLifeThreatening || isPregnant ? '#B91C1C' : '#B45309'} />
          <Text strong style={{ fontSize: 12, color: hasLifeThreatening || isPregnant ? '#B91C1C' : '#92400E' }}>
            تنبيه طبي عاجل (MEDICAL ALERTS):
          </Text>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isPregnant && (
              <Tag color="magenta" style={{ fontSize: 11, margin: 0, borderRadius: 4, fontWeight: 700 }}>
                🤰 سيدة حامل (Pregnant)
              </Tag>
            )}
            {conditions.map((c, i) => (
              <Tag
                key={`c-${i}`}
                color="volcano"
                style={{ fontSize: 11, margin: 0, borderRadius: 4, fontWeight: 600 }}
              >
                ⚠️ {c.name}
              </Tag>
            ))}
            {allergies.map((a, i) => (
              <Tag
                key={`a-${i}`}
                color={a.severity === 'life_threatening' ? 'red' : 'orange'}
                style={{ fontSize: 11, margin: 0, borderRadius: 4, fontWeight: 600 }}
              >
                حساسية دواء: {a.allergen} ({a.severity.replace('_', ' ')})
              </Tag>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
