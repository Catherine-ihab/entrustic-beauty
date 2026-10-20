import { useState } from 'react';
import { Table, Button, Space, Input, Tag, Modal, Form, Select, Typography, message } from 'antd';
import { IPatient, Gender, PatientStatus } from '@clinic/shared-types';
import { UserPlus, Search, ExternalLink } from 'lucide-react';
import { PatientProfile } from './PatientProfile/PatientProfile';
import { VisitWorkspace } from '../visits/VisitWorkspace';

const { Title } = Typography;

export function PatientsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [visitingPatientId, setVisitingPatientId] = useState<string | null>(null);

  const [patients, setPatients] = useState<IPatient[]>([
    {
      id: 'p-1',
      clinicId: 'demo',
      patientNumber: 'PAT-00001',
      firstName: 'Ahmad',
      lastName: 'Hassan Al-Sayed',
      gender: Gender.MALE,
      phone: '+20 100 123 4567',
      status: PatientStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p-2',
      clinicId: 'demo',
      patientNumber: 'PAT-00002',
      firstName: 'Sara',
      lastName: 'El-Sayed',
      gender: Gender.FEMALE,
      phone: '+20 111 987 6543',
      status: PatientStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p-3',
      clinicId: 'demo',
      patientNumber: 'PAT-00003',
      firstName: 'Mohamed',
      lastName: 'Ibrahim',
      gender: Gender.MALE,
      phone: '+20 122 555 6789',
      status: PatientStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

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

  const handleCreate = (values: any) => {
    const newPatient: IPatient = {
      id: `p-${Date.now()}`,
      clinicId: 'demo',
      patientNumber: `PAT-${String(patients.length + 1).padStart(5, '0')}`,
      firstName: values.firstName,
      lastName: values.lastName,
      gender: values.gender || Gender.UNSPECIFIED,
      phone: values.phone,
      status: PatientStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPatients([newPatient, ...patients]);
    setIsModalOpen(false);
    form.resetFields();
    message.success('Patient registered successfully');
  };

  const columns = [
    {
      title: 'رقم الملف / الحالة',
      dataIndex: 'patientNumber',
      key: 'patientNumber',
      render: (num: string) => (
        <Tag color="magenta" style={{ fontWeight: 600, borderRadius: 8, fontFamily: 'monospace' }}>
          {num}
        </Tag>
      ),
    },
    {
      title: 'اسم الحالة / العميلة',
      key: 'fullName',
      render: (_: any, r: IPatient) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>
          {r.firstName} {r.lastName}
        </span>
      ),
    },
    {
      title: 'النوع',
      dataIndex: 'gender',
      key: 'gender',
      render: (g: Gender) => (
        <span style={{ color: '#64748B', fontSize: 13 }}>
          {g === Gender.FEMALE ? 'أنثى' : g === Gender.MALE ? 'ذكر' : 'غير محدد'}
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
      render: (status: PatientStatus) => (
        <Tag
          color={status === PatientStatus.ACTIVE ? 'green' : 'orange'}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          {status === PatientStatus.ACTIVE ? 'نشط' : status}
        </Tag>
      ),
    },
    {
      title: 'الملف الطبي',
      key: 'actions',
      width: 140,
      render: (_: any, r: IPatient) => (
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
            {patients.length} حالة وعميلة مسجلة بالمركز
          </div>
        </div>
        <Space>
          <Input
            placeholder="بحث في الحالات بالاسم أو الهاتف…"
            prefix={<Search size={14} color="#94A3B8" />}
            style={{ width: 260, borderRadius: 8 }}
          />
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

      <Table
        dataSource={patients}
        columns={columns}
        rowKey="id"
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
          <Form.Item name="gender" label="النوع" initialValue={Gender.FEMALE}>
            <Select>
              <Select.Option value={Gender.FEMALE}>أنثى</Select.Option>
              <Select.Option value={Gender.MALE}>ذكر</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
