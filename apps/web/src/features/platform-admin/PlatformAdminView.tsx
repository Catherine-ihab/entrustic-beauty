import { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Space,
  message,
  Card,
  Row,
  Col,
  Alert,
} from 'antd';
import { IPlatformClinicSummary, ClinicStatus, ClinicType } from '@clinic/shared-types';
import { Plus, Shield, CheckCircle, Ban, Building2, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import { PageHeader, MetricCard, StatusBadge } from '../../design-system';

const { Text } = Typography;
const { Option } = Select;

const CLINIC_TYPE_OPTIONS = [
  { value: ClinicType.GENERAL_MEDICAL, label: 'General Medical Clinic' },
  { value: ClinicType.DENTAL, label: 'Dental Practice' },
  { value: ClinicType.DERMATOLOGY, label: 'Dermatology & Skin Clinic' },
  { value: ClinicType.PHYSIOTHERAPY, label: 'Physiotherapy & Physical Therapy' },
  { value: ClinicType.REHABILITATION, label: 'Rehabilitation Center' },
  { value: ClinicType.NUTRITION, label: 'Nutrition & Dietetics' },
  { value: ClinicType.PSYCHOLOGY, label: 'Psychology & Mental Health' },
  { value: ClinicType.ORTHOPEDIC, label: 'Orthopedic & Joint Center' },
  { value: ClinicType.OPHTHALMOLOGY, label: 'Ophthalmology & Eye Clinic' },
  { value: ClinicType.ENT, label: 'ENT (Ear, Nose, Throat) Clinic' },
  { value: ClinicType.PEDIATRICS, label: 'Pediatrics & Child Health' },
  { value: ClinicType.GYNECOLOGY, label: 'Gynecology & Obstetrics' },
  { value: ClinicType.AESTHETIC, label: 'Aesthetic & Cosmetic Clinic' },
  { value: ClinicType.OTHER, label: 'Specialized Practice' },
  { value: ClinicType.CUSTOM, label: 'Custom Specialty Type' },
];

export function PlatformAdminView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [handoverData, setHandoverData] = useState<any>(null);
  const [form] = Form.useForm();

  const [clinics, setClinics] = useState<IPlatformClinicSummary[]>([
    {
      id: 'clinic-1',
      name: 'Al-Amal Medical & Therapy Center',
      slug: 'demo',
      clinicType: ClinicType.GENERAL_MEDICAL,
      status: ClinicStatus.ACTIVE,
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      defaultLanguage: 'ar',
      branding: {
        primaryColor: '#2563EB',
        welcomeMessage: 'مركز الأمل للرعاية الطبية والتأهيلية المتكاملة',
      },
      enabledModules: ['dashboard', 'patients', 'appointments', 'records', 'services', 'invoices', 'before_after'],
      createdAt: dayjs().subtract(30, 'day').toISOString(),
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'clinic-2',
      name: 'Cairo Physio & Spine Rehab',
      slug: 'physio-cairo',
      clinicType: ClinicType.PHYSIOTHERAPY,
      status: ClinicStatus.ACTIVE,
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      defaultLanguage: 'ar',
      branding: {
        primaryColor: '#059669',
        welcomeMessage: 'عيادة العلاج الطبيعي والتأهيل الحركي',
      },
      enabledModules: ['dashboard', 'patients', 'appointments', 'records', 'services', 'invoices'],
      createdAt: dayjs().subtract(15, 'day').toISOString(),
      updatedAt: dayjs().toISOString(),
    },
    {
      id: 'clinic-3',
      name: 'DermaCare Aesthetic & Skin Clinic',
      slug: 'dermacare',
      clinicType: ClinicType.DERMATOLOGY,
      status: ClinicStatus.ACTIVE,
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      defaultLanguage: 'en',
      branding: {
        primaryColor: '#7C3AED',
        welcomeMessage: 'Clinical Dermatology & Aesthetic Medicine',
      },
      enabledModules: ['dashboard', 'patients', 'appointments', 'records', 'services', 'invoices', 'before_after'],
      createdAt: dayjs().subtract(5, 'day').toISOString(),
      updatedAt: dayjs().toISOString(),
    },
  ]);

  const handleProvision = (values: any) => {
    const cleanSlug = values.slug.toLowerCase().trim();
    const newClinic: IPlatformClinicSummary = {
      id: `clinic-${Date.now()}`,
      name: values.name,
      slug: cleanSlug,
      clinicType: values.clinicType || ClinicType.GENERAL_MEDICAL,
      status: ClinicStatus.ACTIVE,
      currency: values.currency,
      timezone: values.timezone || 'Africa/Cairo',
      defaultLanguage: values.defaultLanguage || 'en',
      branding: {
        primaryColor: values.primaryColor || '#2563EB',
        welcomeMessage: values.welcomeMessage || `Welcome to ${values.name}`,
      },
      enabledModules: values.enabledModules || [
        'dashboard',
        'patients',
        'appointments',
        'records',
        'services',
        'invoices',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setClinics([newClinic, ...clinics]);
    setIsModalOpen(false);

    // Prepare handover credentials modal
    setHandoverData({
      clinicName: newClinic.name,
      slug: cleanSlug,
      url: `https://${cleanSlug}.yourplatform.com`,
      adminEmail: values.adminEmail,
      adminPassword: values.adminPassword || 'Temp#Clinic2026!',
    });

    form.resetFields();
    message.success(`Clinic "${newClinic.name}" provisioned in dedicated isolated environment!`);
  };

  const toggleStatus = (clinic: IPlatformClinicSummary) => {
    const newStatus =
      clinic.status === ClinicStatus.ACTIVE ? ClinicStatus.SUSPENDED : ClinicStatus.ACTIVE;
    setClinics(
      clinics.map((c) => (c.id === clinic.id ? { ...c, status: newStatus } : c)),
    );
    message.info(`Clinic status updated to ${newStatus}`);
  };

  const activeClinicsCount = clinics.filter((c) => c.status === ClinicStatus.ACTIVE).length;

  return (
    <div>
      <PageHeader
        title="Platform Administration Portal"
        subtitle="Manage independent tenant environments, multi-specialty provisioning, and global subscriptions"
        badge={<Tag color="purple">Platform Super Admin</Tag>}
        extra={
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsModalOpen(true)}
            style={{ height: 38 }}
          >
            Provision New Clinic
          </Button>
        }
      />

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Total Tenant Environments"
            value={clinics.length}
            icon={<Building2 size={20} />}
            iconBgColor="#EFF6FF"
            iconColor="#2563EB"
            trendText={`${activeClinicsCount} Active`}
            subtext="isolated databases"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Active RLS Isolation Boundaries"
            value={`${clinics.length} Tenants`}
            icon={<Shield size={20} />}
            iconBgColor="#ECFDF5"
            iconColor="#059669"
            trendText="100% Isolated"
            subtext="PostgreSQL RLS verified"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            title="Supported Clinic Specialties"
            value="15 Types"
            icon={<CheckCircle size={20} />}
            iconBgColor="#F5F3FF"
            iconColor="#7C3AED"
            trendText="Multi-Specialty"
            subtext="zero hardcoded workflows"
          />
        </Col>
      </Row>

      {/* Tenants Table */}
      <Card style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={clinics}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: 'Clinic / Practice Name',
              key: 'name',
              render: (_: any, r: IPlatformClinicSummary) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <code>{r.slug}.yourplatform.com</code>
                  </Text>
                </div>
              ),
            },
            {
              title: 'Specialty / Type',
              dataIndex: 'clinicType',
              key: 'clinicType',
              render: (type: ClinicType) => {
                const opt = CLINIC_TYPE_OPTIONS.find((o) => o.value === type);
                return <Tag color="blue">{opt?.label || type || 'General'}</Tag>;
              },
            },
            {
              title: 'Currency',
              dataIndex: 'currency',
              key: 'currency',
              render: (cur: string) => <Tag color="default">{cur}</Tag>,
            },
            {
              title: 'Brand Palette',
              key: 'color',
              render: (_: any, r: IPlatformClinicSummary) => (
                <Space>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      backgroundColor: r.branding.primaryColor,
                      border: '1px solid #E2E8F0',
                    }}
                  />
                  <Text code style={{ fontSize: 11 }}>
                    {r.branding.primaryColor}
                  </Text>
                </Space>
              ),
            },
            {
              title: 'Active Modules',
              key: 'modules',
              render: (_: any, r: IPlatformClinicSummary) => (
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  {r.enabledModules?.length || 0} modules active
                </span>
              ),
            },
            {
              title: 'Tenant Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: ClinicStatus) => (
                <StatusBadge status={status === ClinicStatus.ACTIVE ? 'active' : 'inactive'} />
              ),
            },
            {
              title: 'Actions',
              key: 'action',
              render: (_: any, r: IPlatformClinicSummary) => (
                <Button
                  danger={r.status === ClinicStatus.ACTIVE}
                  size="small"
                  icon={r.status === ClinicStatus.ACTIVE ? <Ban size={13} /> : <CheckCircle size={13} />}
                  onClick={() => toggleStatus(r)}
                >
                  {r.status === ClinicStatus.ACTIVE ? 'Suspend' : 'Activate'}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Provisioning Modal */}
      <Modal
        title="Provision New Isolated Clinic Tenant"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleProvision}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                label="Practice / Facility Name"
                name="name"
                rules={[{ required: true, message: 'Please provide the clinic legal name' }]}
              >
                <Input placeholder="e.g. Al-Nour Eye & Retina Clinic" size="large" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label="Primary Specialty"
                name="clinicType"
                initialValue={ClinicType.GENERAL_MEDICAL}
                rules={[{ required: true }]}
              >
                <Select size="large">
                  {CLINIC_TYPE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Additional Specialties"
            name="specialties"
            extra="Enable multiple specialties if the clinic has more than one department (e.g. Physiotherapy + Orthopedic)"
          >
            <Select
              mode="multiple"
              size="large"
              placeholder="Select additional specialties (optional)"
              allowClear
            >
              {CLINIC_TYPE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Subdomain URL Slug"
                name="slug"
                rules={[
                  { required: true, message: 'Subdomain is required' },
                  {
                    pattern: /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/,
                    message: 'Lowercase alphanumeric with single hyphens, 3-48 characters',
                  },
                ]}
                extra="Example: alnour-eye → alnour-eye.yourplatform.com"
              >
                <Input placeholder="alnour-eye" size="large" addonAfter=".yourplatform.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Operating Currency"
                name="currency"
                initialValue="EGP"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="EGP">EGP — Egyptian Pound</Option>
                  <Option value="SAR">SAR — Saudi Riyal</Option>
                  <Option value="AED">AED — UAE Dirham</Option>
                  <Option value="USD">USD — US Dollar</Option>
                  <Option value="EUR">EUR — Euro</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Initial Clinic Admin Email" name="adminEmail" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="admin@alnour-eye.com" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Initial Temporary Password" name="adminPassword" initialValue="Temp#Clinic2026!">
                <Input.Password size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Licensed Feature Modules"
            name="enabledModules"
            initialValue={['dashboard', 'patients', 'appointments', 'records', 'services', 'invoices', 'before_after']}
          >
            <Select mode="multiple" size="large" placeholder="Select feature entitlements">
              <Option value="dashboard">Executive Dashboard</Option>
              <Option value="patients">Patients Directory</Option>
              <Option value="appointments">Appointments Calendar</Option>
              <Option value="records">Clinical Records & Version History</Option>
              <Option value="services">Services Catalog</Option>
              <Option value="invoices">Billing & Snapshot Invoices</Option>
              <Option value="before_after">Before & After Photographic Gallery (Optional)</Option>
              <Option value="audit_logs">Regulatory Audit Trail</Option>
            </Select>
          </Form.Item>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Provision Clinic & Initialize Tenant
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Secure Credentials Handover Modal */}
      <Modal
        title="Secure Tenant Handover Card"
        open={!!handoverData}
        onCancel={() => setHandoverData(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setHandoverData(null)}>
            Done
          </Button>,
        ]}
      >
        {handoverData && (
          <div>
            <Alert
              message="Tenant Created Successfully"
              description="Provide these credentials to the clinic owner securely. They will be prompted to change their password on first sign in."
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div
              style={{
                background: '#F8FAFC',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Dedicated Clinic Access URL</Text>
                <div style={{ fontWeight: 600 }}>
                  <a href={handoverData.url} target="_blank" rel="noopener noreferrer">
                    {handoverData.url} <ExternalLink size={13} style={{ verticalAlign: 'middle' }} />
                  </a>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Initial Clinic Administrator</Text>
                <div style={{ fontWeight: 600 }}>{handoverData.adminEmail}</div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Temporary Setup Password</Text>
                <div>
                  <Text code copyable style={{ fontSize: 14 }}>
                    {handoverData.adminPassword}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
