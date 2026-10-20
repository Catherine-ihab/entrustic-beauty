import { useState } from 'react';
import { Table, Button, Tag, Space, Form, Input, Select, DatePicker, Switch, Modal, message } from 'antd';
import { Plus, Pill } from 'lucide-react';
import { useMedications, createMedication, updateMedication, type PatientMedication } from '../api';
import { EmptyState } from '../../../../design-system';
import dayjs from 'dayjs';

const ROUTE_OPTIONS = [
  { value: 'oral', label: 'Oral' },
  { value: 'iv', label: 'IV' },
  { value: 'im', label: 'IM' },
  { value: 'sc', label: 'Subcutaneous' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'other', label: 'Other' },
];

interface MedicationsTabProps {
  patientId: string;
  readonly?: boolean;
}

export function MedicationsTab({ patientId, readonly = false }: MedicationsTabProps) {
  const { data: medications, loading, refetch } = useMedications(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const current = medications.filter((m) => m.is_current);
  const historical = medications.filter((m) => !m.is_current);

  const openNew = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ is_current: true, route: 'oral' });
    setModalOpen(true);
  };

  const openEdit = (record: PatientMedication) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const dto = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };
      if (editingId) {
        await updateMedication(patientId, editingId, dto);
        message.success('Medication updated');
      } else {
        await createMedication(patientId, dto);
        message.success('Medication recorded');
      }
      setModalOpen(false);
      refetch();
    } catch {
      message.error('Failed to save medication');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Medication',
      key: 'name',
      render: (_: any, r: PatientMedication) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.name}</div>
          {r.generic_name && (
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.generic_name}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Dose & Frequency',
      key: 'dose',
      render: (_: any, r: PatientMedication) => (
        <div>
          {r.dose && <span style={{ fontWeight: 500, color: '#334155' }}>{r.dose}{r.unit ? ` ${r.unit}` : ''}</span>}
          {r.frequency && <div style={{ fontSize: 12, color: '#64748B' }}>{r.frequency}</div>}
        </div>
      ),
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (val: string) => (
        <Tag style={{ textTransform: 'capitalize', borderRadius: 6, fontSize: 11 }}>{val}</Tag>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (val: string | null) => val || <span style={{ color: '#94A3B8' }}>—</span>,
    },
    {
      title: 'Prescribed By',
      dataIndex: 'prescribed_by',
      key: 'prescribed_by',
      render: (val: string | null) => val || <span style={{ color: '#94A3B8' }}>—</span>,
    },
    ...(!readonly
      ? [{
          title: '',
          key: 'actions',
          width: 80,
          render: (_: any, r: PatientMedication) => (
            <Button size="small" type="text" onClick={() => openEdit(r)}>Edit</Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill size={18} color="#64748B" />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>Medications</span>
        </div>
        {!readonly && (
          <Button type="primary" icon={<Plus size={15} />} onClick={openNew} size="small">
            Add Medication
          </Button>
        )}
      </div>

      {medications.length === 0 && !loading ? (
        <EmptyState
          icon="pill"
          title="No medications recorded"
          description="Record current and past medications for this patient."
          action={!readonly ? { label: 'Add Medication', onClick: openNew } : undefined}
        />
      ) : (
        <div>
          {current.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag color="blue" style={{ fontWeight: 600 }}>Current ({current.length})</Tag>
              </div>
              <Table
                dataSource={current}
                columns={columns}
                rowKey="id"
                loading={loading}
                size="middle"
                pagination={false}
                style={{ borderRadius: 10, overflow: 'hidden' }}
              />
            </div>
          )}

          {historical.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#94A3B8', marginBottom: 10 }}>
                <Tag style={{ fontWeight: 600 }}>Past Medications ({historical.length})</Tag>
              </div>
              <Table
                dataSource={historical}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                style={{ borderRadius: 10, overflow: 'hidden', opacity: 0.75 }}
              />
            </div>
          )}
        </div>
      )}

      <Modal
        title={editingId ? 'Edit Medication' : 'Add Medication'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Save"
        confirmLoading={saving}
        width={540}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Medication Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Metformin, Amlodipine" />
          </Form.Item>
          <Form.Item name="generic_name" label="Generic Name">
            <Input placeholder="Generic / INN name" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="dose" label="Dose" style={{ flex: 1 }}>
              <Input placeholder="e.g. 500" />
            </Form.Item>
            <Form.Item name="unit" label="Unit" style={{ width: 100 }}>
              <Input placeholder="mg / ml" />
            </Form.Item>
            <Form.Item name="route" label="Route" style={{ flex: 1 }}>
              <Select options={ROUTE_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="frequency" label="Frequency">
            <Input placeholder="e.g. Once daily (OD), Twice daily (BD), TDS" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="start_date" label="Start Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="end_date" label="End Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="prescribed_by" label="Prescribed By">
            <Input placeholder="Doctor name or clinic" />
          </Form.Item>
          <Form.Item name="reason" label="Reason / Indication">
            <Input placeholder="Why is this medication prescribed?" />
          </Form.Item>
          <Form.Item name="is_current" label="Currently Taking" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
