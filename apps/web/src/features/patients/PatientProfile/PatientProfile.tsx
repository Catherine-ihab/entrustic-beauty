import { useState, useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
  Breadcrumb,
} from 'antd';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  Stethoscope,
  ShieldAlert,
  Activity,
  Pill,
  FolderOpen,
  Clock,
  Users,
  FileCheck,
  Plus,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { MedicalSnapshot } from './MedicalSnapshot';
import { useMedicalSnapshot } from './api';
import { AllergiesTab } from './tabs/AllergiesTab';
import { ConditionsTab } from './tabs/ConditionsTab';
import { MedicationsTab } from './tabs/MedicationsTab';
import { FilesTab } from './tabs/FilesTab';
import { OverviewTab, FamilyHistoryTab, ConsentTab } from './tabs/OtherTabs';
import { TimelineTab } from './tabs/TimelineTab';
import { useLang } from '../../../lib/useLang';

const { Title, Text } = Typography;

interface PatientDetails {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_type: string | null;
  status: string;
  created_at: string;
}

function calculateAge(dob: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  return `${age} yrs`;
}

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
  onNewVisit?: (patientId: string) => void;
}

export function PatientProfile({ patientId, onBack, onNewVisit }: PatientProfileProps) {
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const { snapshot, loading: snapshotLoading } = useMedicalSnapshot(patientId);
  const { tx } = useLang();

  useEffect(() => {
    let cancelled = false;
    setLoadingPatient(true);
    apiClient
      .get(`/patients/${patientId}`)
      .then((res: any) => {
        if (cancelled) return;
        setPatient(res?.data || res);
      })
      .catch(() => {
        if (cancelled) return;
        // Identity fields are the only thing rendered if the fetch fails; keep
        // them neutral rather than inventing a male demo patient.
        setPatient({
          id: patientId,
          patient_number: '—',
          first_name: tx('غير متوفر', 'Unavailable'),
          last_name: '',
          date_of_birth: null,
          gender: 'unspecified',
          phone: null,
          email: null,
          address: null,
          blood_type: null,
          status: 'unknown',
          created_at: new Date().toISOString(),
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingPatient(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, tx]);

  // Visit history and upcoming bookings live on their own endpoints; the
  // Overview tab used to be handed two empty arrays so it always claimed
  // "No visits recorded" even for a patient with a full clinical history.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`/visits/patient/${patientId}`)
      .then((res: any) => {
        if (cancelled) return;
        const payload = res?.data ?? res;
        setRecentVisits(Array.isArray(payload) ? payload : (payload?.items ?? []));
      })
      .catch(() => {
        if (!cancelled) setRecentVisits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/appointments', { params: { patientId, limit: 100 } })
      .then((res: any) => {
        if (cancelled) return;
        const payload = res?.data ?? res;
        const rows = Array.isArray(payload) ? payload : (payload?.items ?? []);
        const now = Date.now();
        setUpcomingAppointments(
          rows
            .filter((a: any) => new Date(a.start_time).getTime() >= now)
            .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
        );
      })
      .catch(() => {
        if (!cancelled) setUpcomingAppointments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const primaryColor = '#2563EB';

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stethoscope size={14} />
          {tx('نظرة عامة', 'Overview')}
        </span>
      ),
      children: (
        <OverviewTab
          patientId={patientId}
          recentVisits={recentVisits}
          upcomingAppointments={upcomingAppointments}
          loading={loadingPatient}
        />
      ),
    },
    {
      key: 'allergies',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={14} />
          {tx('الحساسية', 'Allergies')}
          {(snapshot?.alerts.allergyCount ?? 0) > 0 && (
            <Tag
              style={{
                fontSize: 10,
                padding: '0 5px',
                lineHeight: '16px',
                marginInlineStart: 2,
                borderRadius: 10,
                backgroundColor: snapshot?.alerts.hasLifeThreateningAllergy ? '#FEF2F2' : '#FFF7ED',
                color: snapshot?.alerts.hasLifeThreateningAllergy ? '#DC2626' : '#C2410C',
                border: 'none',
              }}
            >
              {snapshot?.alerts.allergyCount}
            </Tag>
          )}
        </span>
      ),
      children: <AllergiesTab patientId={patientId} />,
    },
    {
      key: 'conditions',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} />
          {tx('الحالات الطبية', 'Conditions')}
          {(snapshot?.alerts.conditionCount ?? 0) > 0 && (
            <Tag style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', marginInlineStart: 2, borderRadius: 10, backgroundColor: '#F1F5F9', color: '#64748B', border: 'none' }}>
              {snapshot?.alerts.conditionCount}
            </Tag>
          )}
        </span>
      ),
      children: <ConditionsTab patientId={patientId} />,
    },
    {
      key: 'medications',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill size={14} />
          {tx('الأدوية والمستحضرات', 'Medications')}
          {(snapshot?.alerts.medicationCount ?? 0) > 0 && (
            <Tag style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', marginInlineStart: 2, borderRadius: 10, backgroundColor: '#F1F5F9', color: '#64748B', border: 'none' }}>
              {snapshot?.alerts.medicationCount}
            </Tag>
          )}
        </span>
      ),
      children: <MedicationsTab patientId={patientId} />,
    },
    {
      key: 'files',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FolderOpen size={14} />
          {tx('المستندات والملفات', 'Files')}
        </span>
      ),
      children: <FilesTab patientId={patientId} />,
    },
    {
      key: 'family-history',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={14} />
          {tx('التاريخ العائلي', 'Family History')}
        </span>
      ),
      children: <FamilyHistoryTab patientId={patientId} />,
    },
    {
      key: 'consents',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileCheck size={14} />
          {tx('الموافقات والإقرارات', 'Consents')}
        </span>
      ),
      children: <ConsentTab patientId={patientId} />,
    },
    {
      key: 'timeline',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} />
          {tx('الخط الزمني للحالة', 'Timeline')}
        </span>
      ),
      children: <TimelineTab patientId={patientId} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  style={{ cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={onBack}
                >
                  <ArrowLeft size={13} />
                  {tx('سجل الحالات والعملاء', 'Patients Directory')}
                </span>
              ),
            },
            {
              title: loadingPatient ? tx('جارٍ التحميل...', 'Loading...') : `${patient?.first_name} ${patient?.last_name}`,
            },
          ]}
        />
      </div>

      {/* Patient Header Card */}
      <Card
        style={{
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        {loadingPatient ? (
          <Skeleton avatar active paragraph={{ rows: 2 }} />
        ) : patient ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            {/* Left: Identity */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Avatar
                size={64}
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${primaryColor}30`,
                }}
              >
                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
              </Avatar>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Title level={4} style={{ margin: 0, color: '#0F172A', lineHeight: 1.2 }}>
                    {patient.first_name} {patient.last_name}
                  </Title>
                  <Tag color="blue" style={{ fontWeight: 600, fontSize: 12, borderRadius: 8 }}>
                    {patient.patient_number}
                  </Tag>
                  <Tag
                    color={patient.status === 'active' ? 'green' : 'orange'}
                    style={{ borderRadius: 8, fontSize: 11 }}
                  >
                    {patient.status}
                  </Tag>

                  {/* PROMINENT ALERT TAGS */}
                  {snapshot?.alerts?.hasLifeThreateningAllergy && (
                    <Tag
                      color="red"
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: 8,
                        padding: '2px 8px',
                        backgroundColor: '#FEF2F2',
                        border: '1.5px solid #DC2626',
                        color: '#DC2626',
                      }}
                    >
                      🚨 حساسية خطيرة ({snapshot.allergies.find(a => a.severity === 'life_threatening')?.allergen || 'أدوية'})
                    </Tag>
                  )}
                  {snapshot?.conditions && snapshot.conditions.length > 0 && (
                    <Tag
                      color="volcano"
                      style={{
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 8,
                        padding: '2px 8px',
                        backgroundColor: '#FFF7ED',
                        border: '1px solid #EA580C',
                        color: '#C2410C',
                      }}
                    >
                      ⚠️ مرض مزمن: {snapshot.conditions.map(c => c.name).join('، ')}
                    </Tag>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
                  {patient.gender && (
                    <Text style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} />
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                      {patient.date_of_birth && ` · ${calculateAge(patient.date_of_birth)}`}
                    </Text>
                  )}
                  {patient.blood_type && (
                    <Tag style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                      {patient.blood_type}
                    </Tag>
                  )}
                  {patient.phone && (
                    <Text style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={13} />
                      {patient.phone}
                    </Text>
                  )}
                  {patient.email && (
                    <Text style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={13} />
                      {patient.email}
                    </Text>
                  )}
                  {patient.address && (
                    <Text style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} />
                      {patient.address}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <Space wrap>
              {onNewVisit && (
                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  onClick={() => onNewVisit(patientId)}
                  style={{ height: 38, fontWeight: 500 }}
                >
                  New Visit
                </Button>
              )}
              <Button icon={<Calendar size={15} />} style={{ height: 38 }}>
                Book Appointment
              </Button>
              <Button icon={<User size={15} />} style={{ height: 38 }}>
                Edit Patient
              </Button>
            </Space>
          </div>
        ) : null}
      </Card>

      {/* Medical Snapshot Strip */}
      <MedicalSnapshot
        allergies={snapshot?.allergies || []}
        conditions={snapshot?.conditions || []}
        medications={snapshot?.currentMedications || []}
        loading={snapshotLoading}
        onAllergyClick={() => setActiveTab('allergies')}
        onConditionClick={() => setActiveTab('conditions')}
        onMedicationClick={() => setActiveTab('medications')}
      />

      {/* Tabbed Clinical Workspace */}
      <Card
        style={{
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ padding: '0' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ paddingInline: 24 }}
          tabBarStyle={{ marginBottom: 0 }}
          tabBarExtraContent={
            <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={13} color="#94A3B8" />
              <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                Patient since {patient ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
              </Text>
            </div>
          }
        />
        <div style={{ padding: '20px 24px' }}>
          {tabItems.find(t => t.key === activeTab)?.children}
        </div>
      </Card>
    </div>
  );
}
