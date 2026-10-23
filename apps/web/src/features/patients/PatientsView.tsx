import { useState } from 'react';
import { Table, Button, Space, Input, Tag, Modal, Form, Select, Typography, message } from 'antd';
import { UserPlus, Search, ExternalLink, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { PatientProfile } from './PatientProfile/PatientProfile';
import { VisitWorkspace } from '../visits/VisitWorkspace';
import { usePatients, type PatientRow } from './usePatients';

const { Title } = Typography;

const GENDER_LABELS: Record<string, string> = {
  female: 'أنثى',
  male: 'ذكر',
  unspecified: 'غير محدد',
};

export function PatientsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [visitingPatientId, setVisitingPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { patients, loading, error, refetch } = usePatients(search.trim() || undefined);

  if (visitingPatientId) {
    return (
      <VisitWorkspace
        patientId={visitingPatientId}
        onBack={() => setVisitingPatientId(null)}
        onCompleted={() => setVisitingPatientId(null)}
      />
    );
  }

  // If a patient profile is selected, render it full-screen
  if (selectedPatientId) {
    return (
      <PatientProfile
        patientId={selectedPatientId}
        onBack={() => setSelectedPatientId(null)}
        onNewVisit={(id) => {
          setVisitingPatientId(id);
        }}
      />
    );
  }

  const handleCreate = async (values: any) => {
    setSaving(true);
    try {
      await apiClient.post('/patients', {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        gender: values.gender || 'female',
      });
      setIsModalOpen(false);
      form.resetFields();
      message.success('تم تسجيل الحالة بنجاح');
      refetch();
    } catch (err: any) {
      message.error(err?.message || 'تعذر تسجيل الحالة');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'رقم الملف / الحالة',
      dataIndex: 'patient_number',
      key: 'patient_number',
      render: (num: string) => (
        <Tag color="magenta" style={{ fontWeight: 600, borderRadius: 8, fontFamily: 'monospace' }}>
          {num}
        </Tag>
      ),
    },
    {
      title: 'اسم الحالة / العميلة',
      key: 'fullName',
      render: (_: any, r: PatientRow) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>
          {r.first_name} {r.last_name}
        </span>
      ),
    },
    {
      title: 'النوع',
      dataIndex: 'gender',
      key: 'gender',
      render: (g: string) => (
        <span style={{ color: '#64748B', fontSize: 13 }}>
          {GENDER_LABELS[g] || 'غير محدد'}
        </span>
      ),
    },
    {
      title: 'رقم الهاتف',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string) => (
        <span style={{ color: '#64748B', fontSize: 13 }}>{val || '—'}</span>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'active' ? 'green' : 'orange'}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          {status === 'active' ? 'نشط' : status}
        </Tag>
      ),
    },
    {
      title: 'الملف الطبي',
      key: 'actions',
      width: 140,
      render: (_: any, r: PatientRow) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<ExternalLink size={13} />}
          onClick={() => setSelectedPatientId(r.id)}
          style={{ borderRadius: 8, color: '#be185d', borderColor: '#be185d' }}
        >
          فتح الملف الطبي
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
            سجل الحالات والعملاء (Clients & Cases Directory)
          </Title>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            {loading ? 'جارٍ تحميل الحالات…' : `${patients.length} حالة وعميلة مسجلة بالمركز`}
          </div>
        </div>
        <Space>
          <Input
            placeholder="بحث في الحالات بالاسم أو الهاتف…"
            prefix={<Search size={14} color="#64748B" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260, borderRadius: 8 }}
          />
          <Button
            icon={<RefreshCw size={15} />}
            onClick={refetch}
            loading={loading}
            style={{ height: 38, borderRadius: 8 }}
          >
            تحديث
          </Button>
          <Button
            type="primary"
            icon={<UserPlus size={15} />}
            onClick={() => setIsModalOpen(true)}
            style={{ height: 38, fontWeight: 600, backgroundColor: '#be185d', borderColor: '#be185d', borderRadius: 8 }}
          >
            + تسجيل حالة جديدة
          </Button>
        </Space>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 13 }}>
          تعذر تحميل بيانات الحالات: {error}
        </div>
      )}

      <Table
        dataSource={patients}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showTotal: (total) => `${total} حالة` }}
        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}
        rowClassName={() => 'patient-row'}
        onRow={(r) => ({
          style: { cursor: 'pointer' },
          onDoubleClick: () => setSelectedPatientId(r.id),
        })}
      />

      {/* Register Case Modal */}
      <Modal
        title="تسجيل ملف حالة / عميلة جديدة"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="تسجيل وفتح الملف"
        cancelText="إلغاء"
        width={460}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="firstName" label="الاسم الأول" rules={[{ required: true }]}>
              <Input placeholder="الاسم الأول" />
            </Form.Item>
            <Form.Item name="lastName" label="اسم العائلة" rules={[{ required: true }]}>
              <Input placeholder="اسم العائلة" />
            </Form.Item>
          </div>
          <Form.Item name="phone" label="رقم الهاتف المحمول" rules={[{ required: true }]}>
            <Input placeholder="01XXXXXXXXX" />
          </Form.Item>
          <Form.Item name="gender" label="النوع" initialValue="female">
            <Select>
              <Select.Option value="female">أنثى</Select.Option>
              <Select.Option value="male">ذكر</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
