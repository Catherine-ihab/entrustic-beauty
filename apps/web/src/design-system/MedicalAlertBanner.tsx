import { Alert, Space, Tag, Typography } from 'antd';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

const { Text } = Typography;

interface AllergyAlert {
  allergen: string;
  severity: string;
}

interface MedicalAlertBannerProps {
  allergies: AllergyAlert[];
}

const SEVERITY_COLOR: Record<string, string> = {
  life_threatening: '#B91C1C',
  severe: '#EA580C',
  moderate: '#B45309',
  mild: '#65A30D',
  unknown: '#64748B',
};

const SEVERITY_LABEL: Record<string, string> = {
  life_threatening: 'Life-Threatening',
  severe: 'Severe',
  moderate: 'Moderate',
  mild: 'Mild',
  unknown: 'Unknown',
};

/**
 * A high-visibility allergy alert strip shown in all patient-context screens.
 * If any allergy is life_threatening or severe, it renders in red.
 */
export function MedicalAlertBanner({ allergies }: MedicalAlertBannerProps) {
  if (!allergies || allergies.length === 0) return null;

  const hasLifeThreatening = allergies.some((a) => a.severity === 'life_threatening');
  const hasSevere = allergies.some((a) => a.severity === 'severe');
  const isHighAlert = hasLifeThreatening || hasSevere;

  return (
    <Alert
      type={isHighAlert ? 'error' : 'warning'}
      icon={isHighAlert ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
      showIcon
      style={{
        marginBottom: 16,
        borderRadius: 10,
        border: `1.5px solid ${isHighAlert ? '#FECACA' : '#FDE68A'}`,
        backgroundColor: isHighAlert ? '#FEF2F2' : '#FFFBEB',
      }}
      message={
        <Space size={8} wrap>
          <Text strong style={{ color: isHighAlert ? '#991B1B' : '#92400E', fontSize: 13 }}>
            ⚠️ Allergy Alert:
          </Text>
          {allergies.map((a, i) => (
            <Tag
              key={i}
              style={{
                backgroundColor: `${SEVERITY_COLOR[a.severity] || '#64748B'}15`,
                border: `1px solid ${SEVERITY_COLOR[a.severity] || '#64748B'}40`,
                color: SEVERITY_COLOR[a.severity] || '#64748B',
                fontWeight: 600,
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {a.allergen} — {SEVERITY_LABEL[a.severity] || a.severity}
            </Tag>
          ))}
        </Space>
      }
    />
  );
}
