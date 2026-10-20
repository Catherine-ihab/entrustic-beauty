import { Card, Row, Col, Tag, Typography, Skeleton } from 'antd';
import { ShieldAlert, Activity, Pill, AlertTriangle } from 'lucide-react';

const { Text } = Typography;

interface PatientAllergy {
  id: string;
  allergen: string;
  severity: string;
  status: string;
}

interface PatientCondition {
  id: string;
  name: string;
  severity: string | null;
  status: string;
}

interface PatientMedication {
  id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
  is_current: boolean;
}

interface MedicalSnapshotProps {
  allergies: PatientAllergy[];
  conditions: PatientCondition[];
  medications: PatientMedication[];
  loading?: boolean;
  onAllergyClick?: () => void;
  onConditionClick?: () => void;
  onMedicationClick?: () => void;
}

const SEVERITY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  life_threatening: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  severe:           { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  moderate:         { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  mild:             { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  critical:         { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  unknown:          { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
};

function getSeverityStyle(severity: string | null) {
  return SEVERITY_COLOR[severity || 'unknown'] || SEVERITY_COLOR['unknown'];
}

export function MedicalSnapshot({
  allergies,
  conditions,
  medications,
  loading,
  onAllergyClick,
  onConditionClick,
  onMedicationClick,
}: MedicalSnapshotProps) {
  const hasLifeThreatening = allergies.some((a) => a.severity === 'life_threatening');
  const hasUnconfirmedAllergies = allergies.length === 0;

  if (loading) {
    return (
      <Card style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 12,
        border: hasLifeThreatening ? '1.5px solid #FECACA' : '1px solid #E2E8F0',
        backgroundColor: hasLifeThreatening ? '#FFFAFA' : '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {hasLifeThreatening ? (
          <ShieldAlert size={16} color="#DC2626" />
        ) : (
          <Activity size={16} color="#64748B" />
        )}
        <Text style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
          Medical Snapshot
        </Text>
        {hasLifeThreatening && (
          <Tag color="red" style={{ fontSize: 11, fontWeight: 600 }}>
            ⚠️ LIFE-THREATENING ALLERGY
          </Tag>
        )}
      </div>

      <Row gutter={12}>
        {/* Allergies Card */}
        <Col xs={24} sm={8}>
          <div
            onClick={onAllergyClick}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: hasLifeThreatening ? '#FEF2F2' : allergies.length === 0 ? '#FFFBEB' : '#F8FAFC',
              border: `1px solid ${hasLifeThreatening ? '#FECACA' : allergies.length === 0 ? '#FDE68A' : '#E2E8F0'}`,
              cursor: onAllergyClick ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              minHeight: 90,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ShieldAlert size={14} color={hasLifeThreatening ? '#DC2626' : allergies.length === 0 ? '#D97706' : '#64748B'} />
              <Text style={{ fontSize: 12, fontWeight: 600, color: hasLifeThreatening ? '#DC2626' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Allergies ({allergies.length})
              </Text>
            </div>

            {hasUnconfirmedAllergies ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} color="#D97706" />
                <Text style={{ fontSize: 12, color: '#92400E', fontWeight: 500 }}>
                  Not confirmed — verify
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {allergies.slice(0, 3).map((a) => {
                  const s = getSeverityStyle(a.severity);
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{a.allergen}</Text>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.03em',
                      }}>
                        {a.severity.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
                {allergies.length > 3 && (
                  <Text style={{ fontSize: 11, color: '#64748B' }}>+{allergies.length - 3} more</Text>
                )}
              </div>
            )}
          </div>
        </Col>

        {/* Conditions Card */}
        <Col xs={24} sm={8}>
          <div
            onClick={onConditionClick}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: onConditionClick ? 'pointer' : 'default',
              minHeight: 90,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Activity size={14} color="#64748B" />
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Conditions ({conditions.length})
              </Text>
            </div>

            {conditions.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>None recorded</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {conditions.slice(0, 3).map((c) => {
                  const s = getSeverityStyle(c.severity);
                  return (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{c.name}</Text>
                      {c.severity && (
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 4,
                          backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`,
                        }}>
                          {c.severity}
                        </span>
                      )}
                    </div>
                  );
                })}
                {conditions.length > 3 && (
                  <Text style={{ fontSize: 11, color: '#64748B' }}>+{conditions.length - 3} more</Text>
                )}
              </div>
            )}
          </div>
        </Col>

        {/* Medications Card */}
        <Col xs={24} sm={8}>
          <div
            onClick={onMedicationClick}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: onMedicationClick ? 'pointer' : 'default',
              minHeight: 90,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Pill size={14} color="#64748B" />
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Medications ({medications.length})
              </Text>
            </div>

            {medications.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>None recorded</Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {medications.slice(0, 3).map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{m.name}</Text>
                    {m.dose && (
                      <Text style={{ fontSize: 11, color: '#64748B' }}>{m.dose}</Text>
                    )}
                  </div>
                ))}
                {medications.length > 3 && (
                  <Text style={{ fontSize: 11, color: '#64748B' }}>+{medications.length - 3} more</Text>
                )}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
}
