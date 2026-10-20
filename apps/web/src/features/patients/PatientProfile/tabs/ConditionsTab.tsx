import { useState } from 'react';
import { Table, Button, Tag, Space, Form, Input, Select, DatePicker, Modal, message } from 'antd';
import { Plus, Activity } from 'lucide-react';
import { useConditions, createCondition, updateCondition, type PatientCondition } from '../api';
import { EmptyState } from '../../../../design-system';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'managed', label: 'Managed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'suspected', label: 'Suspected' },
];

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'critical', label: 'Critical' },
];

const STATUS_COLOR: Record<string, string> = {
  active: 'red',
  managed: 'blue',
  resolved: 'green',
  suspected: 'orange',
};

const SEVERITY_COLOR: Record<string, string> = {
  mild: 'green',
  moderate: 'orange',
  severe: 'red',
  critical: 'volcano',
};

interface ConditionsTabProps {
  patientId: string;
  readonly?: boolean;
}

export function ConditionsTab({ patientId, readonly = false }: ConditionsTabProps) {
  const { data: conditions, loading, refetch } = useConditions(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openNew = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', severity: 'moderate' });
    setModalOpen(true);
  };

  const openEdit = (record: PatientCondition) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      onset_date: record.onset_date ? dayjs(record.onset_date) : null,
      resolution_date: record.resolution_date ? dayjs(record.resolution_date) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const dto = {
        ...values,
        onset_date: values.onset_date ? values.onset_date.format('YYYY-MM-DD') : null,
        resolution_date: values.resolution_date ? values.resolution_date.format('YYYY-MM-DD') : null,
      };
      if (editingId) {
        await updateCondition(patientId, editingId, dto);
        message.success('Condition updated');
      } else {
        await createCondition(patientId, dto);
        message.success('Condition added');
      }
      setModalOpen(false);
      refetch();
    } catch {
      message.error('Failed to save condition');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Condition',
      dataIndex: 'name',
      key: 'name',
      render: (val: string, r: PatientCondition) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{val}</div>
          {r.icd_code && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>ICD: {r.icd_code}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => (
        <Tag color={STATUS_COLOR[val] || 'default'} style={{ textTransform: 'capitalize', borderRadius: 6 }}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (val: string | null) =>
        val ? (
          <Tag color={SEVERITY_COLOR[val] || 'default'} style={{ textTransform: 'capitalize', borderRadius: 6 }}>
            {val}
          </Tag>
        ) : (
          <span style={{ color: '#94A3B8' }}>—</span>
        ),
    },
    {
      title: 'Onset',
      dataIndex: 'onset_date',
      key: 'onset_date',
      render: (val: string | null) => val || <span style={{ color: '#94A3B8' }}>—</span>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (val: string | null) => val || <span style={{ color: '#94A3B8' }}>—</span>,
    },
    ...(!readonly
      ? [{
          title: '',
          key: 'actions',
          width: 80,
          render: (_: any, r: PatientCondition) => (
            <Button size="small" type="text" onClick={() => openEdit(r)}>Edit</Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="#64748B" />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>Chronic Conditions</span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            (separate from visit diagnoses)
          </span>
        </div>
        {!readonly && (
          <Button type="primary" icon={<Plus size={15} />} onClick={openNew} size="small">
            Add Condition
          </Button>
        )}
      </div>

      {conditions.length === 0 && !loading ? (
        <EmptyState
          icon="activity"
          title="No chronic conditions recorded"
          description="Chronic conditions are separate from individual visit diagnoses."
          action={!readonly ? { label: 'Add Condition', onClick: openNew } : undefined}
        />
      ) : (
        <Table
          dataSource={conditions}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={false}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        />
      )}

      <Modal
        title={editingId ? 'Edit Condition' : 'Add Chronic Condition'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Save"
        confirmLoading={saving}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Condition Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Type 2 Diabetes, Hypertension" />
          </Form.Item>
          <Form.Item name="icd_code" label="ICD-10 Code (optional)">
            <Input placeholder="e.g. E11, I10" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={STATUS_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="severity" label="Severity" style={{ flex: 1 }}>
              <Select options={SEVERITY_OPTIONS} style={{ width: '100%' }} allowClear placeholder="Select severity" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="onset_date" label="Onset Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="resolution_date" label="Resolution Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Clinical notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
