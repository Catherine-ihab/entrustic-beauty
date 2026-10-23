import { useState } from 'react';
import {
  Tag,
  Card,
  Empty,
  Skeleton,
  Typography,
  Table,
  Button,
  Form,
  Input,
  Select,
  Modal,
  message,
} from 'antd';
import {
  Stethoscope,
  Calendar,
  Plus,
  Users,
  FileCheck,
} from 'lucide-react';
import {
  useFamilyHistory,
  createFamilyHistory,
  useConsents,
  createConsent,
} from '../api';
import { EmptyState } from '../../../../design-system';

const { Text } = Typography;

// ─── Overview Tab ─────────────────────────────────────────────────────────────

interface Visit {
  id: string;
  original_visit_date: string;
  status: string;
  current_version: number;
}

interface Appointment {
  id: string;
  start_time: string;
  status: string;
}

interface OverviewTabProps {
  patientId: string;
  recentVisits?: Visit[];
  upcomingAppointments?: Appointment[];
  loading?: boolean;
  onOpenVisit?: (visitId: string) => void;
  onNewVisit?: () => void;
}

export function OverviewTab({
  recentVisits = [],
  upcomingAppointments = [],
  loading,
  onOpenVisit,
}: OverviewTabProps) {
  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Recent Visits */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stethoscope size={16} color="#64748B" />
            <span style={{ fontSize: 14 }}>Recent Visits</span>
          </div>
        }
        size="small"
        style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
      >
        {recentVisits.length === 0 ? (
          <Empty description="No visits recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentVisits.slice(0, 5).map((v) => (
              <div
                key={v.id}
                onClick={() => onOpenVisit?.(v.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                  cursor: onOpenVisit ? 'pointer' : 'default',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.15s',
                }}
              >
                <div>
                  <Text style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                    {new Date(v.original_visit_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Version {v.current_version}
                  </div>
                </div>
                <Tag color={v.status === 'finalized' ? 'green' : 'orange'} style={{ borderRadius: 6 }}>
                  {v.status}
                </Tag>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Appointments */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#64748B" />
            <span style={{ fontSize: 14 }}>Upcoming Appointments</span>
          </div>
        }
        size="small"
        style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
      >
        {upcomingAppointments.length === 0 ? (
          <Empty description="No upcoming appointments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingAppointments.slice(0, 5).map((a) => (
              <div
                key={a.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                }}
              >
                <Text style={{ fontWeight: 600, fontSize: 13, color: '#0369A1' }}>
                  {new Date(a.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {new Date(a.start_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Family History Tab ───────────────────────────────────────────────────────

const RELATIVE_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'maternal_uncle_aunt', label: 'Maternal Uncle/Aunt' },
  { value: 'paternal_uncle_aunt', label: 'Paternal Uncle/Aunt' },
  { value: 'other', label: 'Other' },
];

interface FamilyHistoryTabProps {
  patientId: string;
  readonly?: boolean;
}

export function FamilyHistoryTab({ patientId, readonly = false }: FamilyHistoryTabProps) {
  const { data: entries, loading, refetch } = useFamilyHistory(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await createFamilyHistory(patientId, values);
      message.success('Family history entry added');
      setModalOpen(false);
      form.resetFields();
      refetch();
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Relative',
      dataIndex: 'relative',
      key: 'relative',
      render: (val: string) => (
        <Tag style={{ textTransform: 'capitalize', borderRadius: 6 }}>
          {val.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (val: string) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{val}</span>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (val: string | null) => val || <span style={{ color: '#64748B' }}>—</span>,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color="#64748B" />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>
            Family & Genetic History
          </span>
        </div>
        {!readonly && (
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => {
              form.resetFields();
              setModalOpen(true);
            }}
            size="small"
          >
            Add Entry
          </Button>
        )}
      </div>

      {entries.length === 0 && !loading ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No family history recorded"
          description="Document hereditary conditions and genetic risk factors."
          action={
            !readonly
              ? {
                  label: 'Add Entry',
                  onClick: () => {
                    form.resetFields();
                    setModalOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <Table
          dataSource={entries}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={false}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        />
      )}

      <Modal
        title="Add Family History Entry"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Save"
        confirmLoading={saving}
        width={440}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="relative" label="Family Member" rules={[{ required: true }]}>
            <Select options={RELATIVE_OPTIONS} placeholder="Select relative" />
          </Form.Item>
          <Form.Item name="condition" label="Condition" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Type 2 Diabetes, Heart Disease" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ─── Consent Tab ─────────────────────────────────────────────────────────────

const CONSENT_TYPE_OPTIONS = [
  { value: 'treatment', label: 'Treatment Consent' },
  { value: 'procedure', label: 'Procedure Consent' },
  { value: 'photo', label: 'Photo/Video Consent' },
  { value: 'data_processing', label: 'Data Processing' },
  { value: 'research', label: 'Research Participation' },
  { value: 'other', label: 'Other' },
];

const METHOD_OPTIONS = [
  { value: 'verbal', label: 'Verbal' },
  { value: 'written', label: 'Written Signature' },
  { value: 'digital_signature', label: 'Digital Signature' },
  { value: 'witnessed', label: 'Witnessed' },
];

interface ConsentTabProps {
  patientId: string;
  readonly?: boolean;
}

export function ConsentTab({ patientId, readonly = false }: ConsentTabProps) {
  const { data: consents, loading, refetch } = useConsents(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await createConsent(patientId, {
        ...values,
        status: 'given',
        signed_at: new Date().toISOString(),
      });
      message.success('Consent recorded');
      setModalOpen(false);
      form.resetFields();
      refetch();
    } catch {
      message.error('Failed to record consent');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'consent_type',
      key: 'consent_type',
      render: (val: string) => (
        <Tag color="blue" style={{ textTransform: 'capitalize', borderRadius: 6 }}>
          {val.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (val: string) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{val}</span>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (val: string) => (
        <span style={{ textTransform: 'capitalize', color: '#64748B' }}>
          {val.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => (
        <Tag color={val === 'given' ? 'green' : val === 'withdrawn' ? 'red' : 'orange'}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => new Date(val).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileCheck size={18} color="#64748B" />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>Consent Records</span>
        </div>
        {!readonly && (
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => {
              form.resetFields();
              setModalOpen(true);
            }}
            size="small"
          >
            Record Consent
          </Button>
        )}
      </div>

      {consents.length === 0 && !loading ? (
        <EmptyState
          icon={<FileCheck size={24} />}
          title="No consent records"
          description="Record patient consent for treatments, procedures, and data use. Consent records are immutable."
          action={
            !readonly
              ? {
                  label: 'Record Consent',
                  onClick: () => {
                    form.resetFields();
                    setModalOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <Table
          dataSource={consents}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={false}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        />
      )}

      <Modal
        title="Record Patient Consent"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Record Consent"
        confirmLoading={saving}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="consent_type" label="Consent Type" rules={[{ required: true }]}>
            <Select options={CONSENT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Consent for Physiotherapy Treatment" />
          </Form.Item>
          <Form.Item name="content" label="Consent Text" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea
              rows={5}
              placeholder="The exact consent text presented to the patient..."
            />
          </Form.Item>
          <Form.Item name="method" label="Method" rules={[{ required: true }]}>
            <Select options={METHOD_OPTIONS} />
          </Form.Item>
          <Form.Item name="witness" label="Witness (if applicable)">
            <Input placeholder="Witness name" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
