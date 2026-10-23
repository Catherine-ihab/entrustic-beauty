import { Card, Button, Typography, Tag } from 'antd';
import { History, CopyCheck } from 'lucide-react';

const { Text } = Typography;

interface LastVisitData {
  visitDate: string;
  doctorName: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  versionNumber?: number;
}

interface LastVisitSummaryProps {
  lastVisit?: LastVisitData | null;
  onContinuePlan?: (plan: string) => void;
}

export function LastVisitSummary({
  lastVisit,
  onContinuePlan,
}: LastVisitSummaryProps) {
  if (!lastVisit) {
    return (
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={15} color="#64748B" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Previous Visit History</span>
          </div>
        }
        style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
      >
        <Text style={{ fontSize: 12, color: '#64748B' }}>
          This is the patient's first recorded visit at this practice.
        </Text>
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={15} color="#2563EB" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Previous Consultation</span>
          </div>
          <Tag color="blue" style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
            {new Date(lastVisit.visitDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </Tag>
        </div>
      }
      style={{
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        marginBottom: 16,
        backgroundColor: '#FAFCFF',
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 11, color: '#64748B' }}>
          Attending Physician: <strong style={{ color: '#0F172A' }}>{lastVisit.doctorName}</strong>
        </Text>
      </div>

      {lastVisit.chiefComplaint && (
        <div style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Complaint
          </Text>
          <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
            {lastVisit.chiefComplaint}
          </div>
        </div>
      )}

      {lastVisit.diagnosis && (
        <div style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Diagnosis
          </Text>
          <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600, marginTop: 2 }}>
            {lastVisit.diagnosis}
          </div>
        </div>
      )}

      {lastVisit.treatmentPlan && (
        <div style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
            Prescribed Plan
          </Text>
          <div
            style={{
              fontSize: 12,
              color: '#334155',
              marginTop: 2,
              backgroundColor: '#FFFFFF',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
              whiteSpace: 'pre-line',
            }}
          >
            {lastVisit.treatmentPlan}
          </div>
        </div>
      )}

      {lastVisit.treatmentPlan && onContinuePlan && (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<CopyCheck size={13} />}
          onClick={() => onContinuePlan(lastVisit.treatmentPlan || '')}
          style={{ width: '100%', borderRadius: 6, fontWeight: 500 }}
        >
          Continue Previous Plan
        </Button>
      )}
    </Card>
  );
}
