import React, { useState } from 'react';
import {
  Tabs,
  Card,
  Form,
  Input,
  Select,
  Button,
  Switch,
  Table,
  Tag,
  Space,
  Modal,
  Checkbox,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  Building2,
  Palette,
  Users,
  Shield,
  Puzzle,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Database,
  Download,
  HardDrive,
  MessageSquare,
} from 'lucide-react';
import { PageHeader, StatusBadge } from '../../design-system';
import { ClinicType } from '@clinic/shared-types';
import { useAuthStore } from '../../store/auth-store';
import { IS_PLATFORM_OWNER } from '../../store/platform-owner';

const { Text, Paragraph } = Typography;
const { Option } = Select;

const CLINIC_TYPE_LABELS: Record<string, string> = {
  [ClinicType.GENERAL_MEDICAL]: 'General Medical Clinic',
  [ClinicType.DENTAL]: 'Dental Clinic',
  [ClinicType.DERMATOLOGY]: 'Dermatology & Skin Clinic',
  [ClinicType.PHYSIOTHERAPY]: 'Physiotherapy & Physical Therapy',
  [ClinicType.REHABILITATION]: 'Rehabilitation Center',
  [ClinicType.NUTRITION]: 'Nutrition & Dietetics Clinic',
  [ClinicType.PSYCHOLOGY]: 'Psychology & Mental Health Clinic',
  [ClinicType.ORTHOPEDIC]: 'Orthopedic & Joint Center',
  [ClinicType.OPHTHALMOLOGY]: 'Ophthalmology & Eye Clinic',
  [ClinicType.ENT]: 'ENT (Ear, Nose, Throat) Clinic',
  [ClinicType.PEDIATRICS]: 'Pediatrics & Child Health',
  [ClinicType.GYNECOLOGY]: 'Gynecology & Obstetrics',
  [ClinicType.AESTHETIC]: 'Aesthetic & Cosmetic Clinic',
  [ClinicType.OTHER]: 'Specialized Clinic',
  [ClinicType.CUSTOM]: 'Custom Practice Type',
};

const SYSTEM_PERMISSION_CATEGORIES = [
  {
    category: 'Patients',
    permissions: [
      { key: 'patients:read', label: 'View Patients Directory' },
      { key: 'patients:create', label: 'Register New Patients' },
      { key: 'patients:update', label: 'Edit Patient Demographics' },
      { key: 'patients:delete', label: 'Archive Patient Records' },
    ],
  },
  {
    category: 'Appointments & Scheduling',
    permissions: [
      { key: 'appointments:read', label: 'View Appointments Calendar' },
      { key: 'appointments:create', label: 'Book New Appointments' },
      { key: 'appointments:update', label: 'Reschedule / Modify Appointments' },
      { key: 'appointments:delete', label: 'Cancel Scheduled Bookings' },
    ],
  },
  {
    category: 'Clinical Medical Records',
    permissions: [
      { key: 'records:read', label: 'View Consultation Notes & History' },
      { key: 'records:create', label: 'Write New Encounter Records' },
      { key: 'records:amend', label: 'Amend Clinical Records (With Reason)' },
      { key: 'records:delete', label: 'Void / Archive Records' },
    ],
  },
  {
    category: 'Billing & Financials',
    permissions: [
      { key: 'invoices:read', label: 'View Invoices & Financial Reports' },
      { key: 'invoices:create', label: 'Create & Issue Invoices' },
      { key: 'invoices:payment', label: 'Record Payments & Settle Balances' },
    ],
  },
  {
    category: 'Services & Fees',
    permissions: [
      { key: 'services:read', label: 'View Services & Fee Schedule' },
      { key: 'services:manage', label: 'Create, Edit & Price Services' },
    ],
  },
  {
    category: 'Staff & Roles',
    permissions: [
      { key: 'staff:read', label: 'View Staff Directory' },
      { key: 'staff:manage', label: 'Invite & Manage Staff Members' },
      { key: 'roles:read', label: 'View Roles & Authority' },
      { key: 'roles:manage', label: 'Create & Edit Custom Roles' },
    ],
  },
  {
    category: 'Clinic Administration',
    permissions: [
      { key: 'settings:view', label: 'View Clinic Settings' },
      { key: 'settings:manage', label: 'Modify Practice Profile & Branding' },
      { key: 'audit:read', label: 'View Compliance & Regulatory Audit Trail' },
    ],
  },
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'Clinic Owner / Admin': [
    'patients:read', 'patients:create', 'patients:update', 'patients:delete',
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete',
    'records:read', 'records:create', 'records:amend', 'records:delete',
    'invoices:read', 'invoices:create', 'invoices:payment',
    'services:read', 'services:manage',
    'staff:read', 'staff:manage',
    'roles:read', 'roles:manage',
    'settings:view', 'settings:manage',
    'audit:read',
  ],
  'Doctor / Senior Practitioner': [
    'patients:read', 'patients:create', 'patients:update',
    'appointments:read', 'appointments:create', 'appointments:update',
    'records:read', 'records:create', 'records:amend',
    'invoices:read',
    'services:read',
    'settings:view',
  ],
  'Front Desk & Receptionist': [
    'patients:read', 'patients:create', 'patients:update',
    'appointments:read', 'appointments:create', 'appointments:update', 'appointments:delete',
    'invoices:read', 'invoices:create', 'invoices:payment',
    'services:read',
    'settings:view',
  ],
  'Nurse / Clinical Assistant': [
    'patients:read',
    'appointments:read',
    'records:read',
    'services:read',
  ],
  'Accountant / Cashier': [
    'patients:read',
    'invoices:read', 'invoices:create', 'invoices:payment',
    'services:read',
    'settings:view',
  ],
};

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: string;
  status: 'active' | 'suspended';
  phone?: string;
  permissions: string[];
}

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: 'usr-1',
    name: 'Dr. Heba Ramadan',
    username: 'admin@clinic.com',
    password: 'Admin@2026',
    role: 'Clinic Owner / Admin',
    status: 'active',
    phone: '+20 100 234 5678',
    permissions: ROLE_DEFAULT_PERMISSIONS['Clinic Owner / Admin'] || [],
  },
  {
    id: 'usr-2',
    name: 'Dr. Sarah El-Kady',
    username: 'doctor@clinic.com',
    password: 'Doctor@2026',
    role: 'Doctor / Senior Practitioner',
    status: 'active',
    phone: '+20 101 987 6543',
    permissions: ROLE_DEFAULT_PERMISSIONS['Doctor / Senior Practitioner'] || [],
  },
  {
    id: 'usr-3',
    name: 'Mona Youssef',
    username: 'reception@clinic.com',
    password: 'Recep@2026',
    role: 'Front Desk & Receptionist',
    status: 'active',
    phone: '+20 102 345 6789',
    permissions: ROLE_DEFAULT_PERMISSIONS['Front Desk & Receptionist'] || [],
  },
];

function loadStaffAccounts(): StaffMember[] {
  try {
    const raw = localStorage.getItem('clinic_staff_accounts');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_STAFF;
}

export const SettingsView: React.FC = () => {
  const { clinic, setClinic } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm] = Form.useForm();
  const [brandingForm] = Form.useForm();

  // Branding live preview state
  const [brandColor, setBrandColor] = useState(clinic?.branding?.primaryColor || '#2563EB');
  const [welcomeText, setWelcomeText] = useState(clinic?.branding?.welcomeMessage || '');

  // Roles state
  const [roles, setRoles] = useState([
    {
      id: 'role-1',
      name: 'clinic_owner',
      displayName: 'Clinic Owner / Admin',
      description: 'Complete unconstrained authority over clinic operations and staff',
      isSystem: true,
      permissionCount: 22,
    },
    {
      id: 'role-2',
      name: 'senior_practitioner',
      displayName: 'Senior Practitioner / Doctor',
      description: 'Consultations, patient files, clinical amendments, scheduling',
      isSystem: false,
      permissionCount: 14,
    },
    {
      id: 'role-3',
      name: 'receptionist',
      displayName: 'Front Desk & Receptionist',
      description: 'Appointment scheduling, patient registration, and invoice collection',
      isSystem: false,
      permissionCount: 8,
    },
  ]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm] = Form.useForm();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'patients:read',
    'patients:create',
    'appointments:read',
    'appointments:create',
  ]);

  // Staff state with username, password and explicit permissions — persisted in localStorage
  const [staff, setStaff] = useState<StaffMember[]>(loadStaffAccounts);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm] = Form.useForm();
  const [selectedStaffPermissions, setSelectedStaffPermissions] = useState<string[]>([]);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    visible: boolean;
    name: string;
    username: string;
    password?: string;
    role: string;
    phone?: string;
    permissionCount: number;
  } | null>(null);

  const saveStaff = (next: StaffMember[]) => {
    setStaff(next);
    try {
      localStorage.setItem('clinic_staff_accounts', JSON.stringify(next));
    } catch { /* ignore */ }
  };

  // Modules state
  const [modules, setModules] = useState([
    { key: 'appointments', name: 'Multi-Practitioner Scheduling', enabled: true, core: true },
    { key: 'records', name: 'Clinical Records & Immutable Amendments', enabled: true, core: true },
    { key: 'invoices', name: 'Financial Billing & Price Snapshotting', enabled: true, core: true },
    { key: 'before_after', name: 'Before & After Photographic Gallery', enabled: clinic?.enabledModules?.includes('before_after') ?? true, core: false },
    { key: 'audit_logs', name: 'Regulatory Immutable Audit Trail', enabled: true, core: true },
  ]);

  const handleProfileSave = (values: any) => {
    if (clinic) {
      setClinic({
        ...clinic,
        name: values.name,
        clinicType: values.clinicType,
        timezone: values.timezone,
        currency: values.currency,
        phone: values.phone,
        email: values.email,
        address: values.address,
      });
    }
    message.success('Clinic profile updated successfully');
  };

  const handleBrandingSave = (values: any) => {
    if (clinic) {
      setClinic({
        ...clinic,
        branding: {
          ...clinic.branding,
          primaryColor: values.primaryColor,
          welcomeMessage: values.welcomeMessage,
          logoUrl: values.logoUrl,
        },
      });
    }
    message.success('Branding and visual preferences updated');
  };

  const handleCreateRole = (values: any) => {
    const newRole = {
      id: `role-${Date.now()}`,
      name: values.displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName: values.displayName,
      description: values.description,
      isSystem: false,
      permissionCount: selectedPermissions.length,
    };
    setRoles([...roles, newRole]);
    setIsRoleModalOpen(false);
    roleForm.resetFields();
    message.success(`Custom role "${values.displayName}" created`);
  };

  const handleOpenCreateStaff = () => {
    setEditingStaffId(null);
    staffForm.resetFields();
    const defaultRole = 'Doctor / Senior Practitioner';
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[defaultRole] || [];
    setSelectedStaffPermissions(defaultPerms);
    staffForm.setFieldsValue({
      role: defaultRole,
      password: `Clinic#${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setSelectedStaffPermissions(member.permissions || []);
    const parts = member.name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    staffForm.setFieldsValue({
      firstName,
      lastName,
      username: member.username,
      password: member.password || '',
      phone: member.phone || '',
      role: member.role,
    });
    setIsStaffModalOpen(true);
  };

  const handleRoleChange = (newRole: string) => {
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole];
    if (defaultPerms) {
      setSelectedStaffPermissions(defaultPerms);
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    staffForm.setFieldsValue({ password: pwd });
    message.success('Generated new secure password');
  };

  const handleSaveStaff = (values: any) => {
    if (editingStaffId) {
      const updated = staff.map((s) =>
        s.id === editingStaffId
          ? {
              ...s,
              name: `${values.firstName} ${values.lastName}`.trim(),
              username: values.username,
              password: values.password || s.password,
              role: values.role,
              phone: values.phone,
              permissions: selectedStaffPermissions,
            }
          : s
      );
      saveStaff(updated);
      message.success(`Account for "${values.firstName} ${values.lastName}" updated successfully`);
      setIsStaffModalOpen(false);
      staffForm.resetFields();
      setEditingStaffId(null);
    } else {
      const newMember: StaffMember = {
        id: `usr-${Date.now()}`,
        name: `${values.firstName} ${values.lastName}`.trim(),
        username: values.username,
        password: values.password,
        role: values.role,
        status: 'active',
        phone: values.phone,
        permissions: selectedStaffPermissions,
      };
      saveStaff([newMember, ...staff]);
      setIsStaffModalOpen(false);
      staffForm.resetFields();
      message.success(`Account created for ${newMember.name}`);
      setCredentialsModal({
        visible: true,
        name: newMember.name,
        username: newMember.username,
        password: newMember.password,
        role: newMember.role,
        phone: newMember.phone,
        permissionCount: newMember.permissions.length,
      });
    }
  };

  const handleToggleStaffStatus = (member: StaffMember) => {
    const newStatus: 'active' | 'suspended' = member.status === 'active' ? 'suspended' : 'active';
    const updated = staff.map((s) => (s.id === member.id ? { ...s, status: newStatus } : s));
    saveStaff(updated);
    message.info(`User ${member.name} marked as ${newStatus}`);
  };

  const handleDeleteStaff = (memberId: string) => {
    const updated = staff.filter((s) => s.id !== memberId);
    saveStaff(updated);
    message.success('Staff account removed');
  };

  const handleCopyCredentials = (member: { name: string; username: string; password?: string; role: string }) => {
    const text = `🏥 ${clinic?.name || 'Clinic'} Login Credentials\nName: ${member.name}\nUsername / Email: ${member.username}\nPassword: ${member.password || 'Contact Admin'}\nRole: ${member.role}`;
    navigator.clipboard.writeText(text);
    message.success('Login credentials copied to clipboard');
  };

  return (
    <div>
      <PageHeader
        title="Clinic Operations & Settings"
        subtitle="Manage your practice profile, branding, custom roles, practitioners, and clinical modules"
        badge={<StatusBadge status="active" label="Operational" />}
      />

      <Card style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabPosition="top"
          style={{ paddingInline: 24, paddingTop: 12 }}
          items={[
            {
              key: 'profile',
              label: (
                <Space size={6}>
                  <Building2 size={16} />
                  Practice Profile
                </Space>
              ),
              children: (
                <div style={{ padding: '24px 0', maxWidth: 720 }}>
                  <Form
                    form={profileForm}
                    layout="vertical"
                    initialValues={{
                      name: clinic?.name || 'Al-Amal Medical & Therapy Center',
                      clinicType: clinic?.clinicType || ClinicType.GENERAL_MEDICAL,
                      timezone: clinic?.timezone || 'Africa/Cairo',
                      currency: clinic?.currency || 'EGP',
                      phone: clinic?.phone || '+20 2 2795 0000',
                      email: clinic?.email || 'contact@alamal-clinic.com',
                      address: clinic?.address || '14 El-Tahrir St, Downtown, Cairo, Egypt',
                      defaultLanguage: clinic?.defaultLanguage || 'ar',
                    }}
                    onFinish={handleProfileSave}
                  >
                    <Row gutter={16}>
                      <Col span={14}>
                        <Form.Item
                          label={
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              Practice / Clinic Name
                              {!IS_PLATFORM_OWNER && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#64748B',
                                    background: '#F1F5F9',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                  }}
                                >
                                  <Lock size={9} /> Managed by provider
                                </span>
                              )}
                            </span>
                          }
                          name="name"
                          rules={IS_PLATFORM_OWNER ? [{ required: true }] : []}
                        >
                          <Input size="large" disabled={!IS_PLATFORM_OWNER} />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          label={
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              Primary Specialty
                              {!IS_PLATFORM_OWNER && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#64748B',
                                    background: '#F1F5F9',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                  }}
                                >
                                  <Lock size={9} /> Managed by provider
                                </span>
                              )}
                            </span>
                          }
                          name="clinicType"
                          rules={IS_PLATFORM_OWNER ? [{ required: true }] : []}
                        >
                          <Select size="large" disabled={!IS_PLATFORM_OWNER}>
                            {Object.entries(CLINIC_TYPE_LABELS).map(([key, label]) => (
                              <Option key={key} value={key}>
                                {label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    {IS_PLATFORM_OWNER && (
                      <Form.Item
                        label="Additional Specialties"
                        name="specialties"
                        extra="Add departments this clinic operates — doctors can switch between specialties during visits"
                      >
                        <Select
                          mode="multiple"
                          size="large"
                          placeholder="e.g. Physiotherapy, Orthopedic (optional)"
                          allowClear
                        >
                          {Object.entries(CLINIC_TYPE_LABELS).map(([key, label]) => (
                            <Option key={key} value={key}>
                              {label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Operational Timezone" name="timezone" rules={[{ required: true }]}>
                          <Select size="large">
                            <Option value="Africa/Cairo">Africa/Cairo (EET / UTC+2)</Option>
                            <Option value="Asia/Riyadh">Asia/Riyadh (AST / UTC+3)</Option>
                            <Option value="Asia/Dubai">Asia/Dubai (GST / UTC+4)</Option>
                            <Option value="UTC">Universal Coordinated Time (UTC)</Option>
                            <Option value="Europe/London">Europe/London (GMT/BST)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Base Operating Currency" name="currency">
                          <Input size="large" disabled prefix={<Tag color="blue">{clinic?.currency || 'EGP'}</Tag>} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Contact Phone" name="phone">
                          <Input size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Official Email" name="email">
                          <Input size="large" type="email" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label="Facility Physical Address" name="address">
                      <Input.TextArea rows={3} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 140 }}>
                      Save Changes
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: 'branding',
              label: (
                <Space size={6}>
                  <Palette size={16} />
                  Branding & Theme
                </Space>
              ),
              children: (
                <div style={{ padding: '24px 0' }}>
                  <Row gutter={32}>
                    <Col xs={24} md={14}>
                      <Form
                        form={brandingForm}
                        layout="vertical"
                        initialValues={{
                          primaryColor: brandColor,
                          welcomeMessage: welcomeText,
                          logoUrl: clinic?.branding?.logoUrl || '',
                        }}
                        onFinish={handleBrandingSave}
                      >
                        {/* Primary Color */}
                        <Form.Item
                          label={
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              Primary Accent Color
                              {!IS_PLATFORM_OWNER && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, padding: '1px 6px' }}>
                                  <Lock size={9} /> Managed by provider
                                </span>
                              )}
                            </span>
                          }
                          name="primaryColor"
                        >
                          {IS_PLATFORM_OWNER ? (
                            <Space size={12}>
                              <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ width: 64, height: 40, padding: 2, cursor: 'pointer' }} />
                              <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ width: 120 }} />
                              <Space size={6}>
                                {['#2563EB', '#047857', '#6D28D9', '#B45309', '#0369A1', '#E11D48'].map((c) => (
                                  <div key={c} onClick={() => { setBrandColor(c); brandingForm.setFieldsValue({ primaryColor: c }); }}
                                    style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: brandColor === c ? '2px solid #0F172A' : '1px solid #E2E8F0' }}
                                  />
                                ))}
                              </Space>
                            </Space>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: brandColor, border: '1px solid #E2E8F0', flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>{brandColor}</span>
                              <Lock size={12} color="#64748B" />
                            </div>
                          )}
                        </Form.Item>

                        {/* Logo URL */}
                        <Form.Item
                          label={
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              Practice Logo URL
                              {!IS_PLATFORM_OWNER && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, padding: '1px 6px' }}>
                                  <Lock size={9} /> Managed by provider
                                </span>
                              )}
                            </span>
                          }
                          name="logoUrl"
                        >
                          <Input size="large" placeholder="https://cdn.yourplatform.com/clinics/logo.png" disabled={!IS_PLATFORM_OWNER} />
                        </Form.Item>

                        <Form.Item label="Patient Portal Slogan / Welcome Greeting" name="welcomeMessage">
                          <Input.TextArea rows={3} value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} placeholder="e.g. Dedicated Patient-Centered Care & Recovery" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 140 }}>
                          {IS_PLATFORM_OWNER ? 'Apply Branding' : 'Save Preferences'}
                        </Button>
                      </Form>
                    </Col>

                    <Col xs={24} md={10}>
                      <Text strong style={{ display: 'block', marginBottom: 12, color: '#475569' }}>
                        Live Brand Preview Card
                      </Text>
                      <div
                        style={{
                          padding: 24,
                          borderRadius: 16,
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              backgroundColor: brandColor,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 18,
                            }}
                          >
                            {clinic?.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 16 }}>
                              {clinic?.name || 'Al-Amal Center'}
                            </div>
                            <Tag color="default" style={{ fontSize: 11, margin: 0 }}>
                              {CLINIC_TYPE_LABELS[clinic?.clinicType || ClinicType.GENERAL_MEDICAL]}
                            </Tag>
                          </div>
                        </div>

                        <Paragraph style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
                          {welcomeText || 'Dedicated Healthcare & Consultation Services'}
                        </Paragraph>

                        <Button style={{ backgroundColor: brandColor, color: '#FFF', width: '100%', height: 40, border: 'none' }}>
                          Simulated Interactive Action
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'staff',
              label: (
                <Space size={6}>
                  <Users size={16} />
                  Staff Accounts & Permissions
                </Space>
              ),
              children: (
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Text strong style={{ fontSize: 16, color: '#0F172A' }}>
                        Clinic User Accounts & Permissions
                      </Text>
                      <Paragraph style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                        Create usernames, passwords, and configure role-based permissions for every staff member
                      </Paragraph>
                    </div>
                    <Button type="primary" icon={<Plus size={16} />} onClick={handleOpenCreateStaff}>
                      Add Staff Account & Credentials
                    </Button>
                  </div>

                  <Table
                    dataSource={staff}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: 'Staff Member / Login User',
                        dataIndex: 'name',
                        render: (name: string, record: StaffMember) => (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {name.charAt(0)}
                            </div>
                            <div>
                              <Text strong style={{ color: '#0F172A', display: 'block', lineHeight: 1.2 }}>
                                {name}
                              </Text>
                              <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>
                                {record.username}
                              </span>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Assigned Role',
                        dataIndex: 'role',
                        render: (role: string) => (
                          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>
                            {role}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Active Permissions',
                        dataIndex: 'permissions',
                        render: (perms: string[] = []) => (
                          <Tooltip title={perms.join(', ')}>
                            <Tag color="cyan" style={{ borderRadius: 6, cursor: 'pointer' }}>
                              <ShieldCheck size={12} style={{ display: 'inline', marginInlineEnd: 4, verticalAlign: -1 }} />
                              {perms.length} Permissions Active
                            </Tag>
                          </Tooltip>
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        render: (status: string, record: StaffMember) => (
                          <Tooltip title="Click to toggle status">
                            <span style={{ cursor: 'pointer' }} onClick={() => handleToggleStaffStatus(record)}>
                              <StatusBadge status={status} />
                            </span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_: any, record: StaffMember) => (
                          <Space size={8}>
                            <Tooltip title="Edit account & fine-tune permissions">
                              <Button
                                size="small"
                                type="text"
                                icon={<Edit2 size={14} color="#2563EB" />}
                                onClick={() => handleOpenEditStaff(record)}
                              />
                            </Tooltip>
                            <Tooltip title="View & copy login credentials">
                              <Button
                                size="small"
                                type="text"
                                icon={<Key size={14} color="#047857" />}
                                onClick={() =>
                                  setCredentialsModal({
                                    visible: true,
                                    name: record.name,
                                    username: record.username,
                                    password: record.password,
                                    role: record.role,
                                    permissionCount: record.permissions?.length || 0,
                                  })
                                }
                              />
                            </Tooltip>
                            {record.id !== 'usr-1' && (
                              <Popconfirm
                                title="Remove staff account?"
                                description="This will revoke their access."
                                onConfirm={() => handleDeleteStaff(record.id)}
                                okText="Yes, Remove"
                                cancelText="Cancel"
                              >
                                <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
                              </Popconfirm>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'roles',
              label: (
                <Space size={6}>
                  <Shield size={16} />
                  Roles & Permissions Builder
                </Space>
              ),
              children: (
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Text strong style={{ fontSize: 16, color: '#0F172A' }}>
                        Role & Authority Matrix
                      </Text>
                      <Paragraph style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                        Configure customized roles with fine-grained clinical, financial, and scheduling permissions
                      </Paragraph>
                    </div>
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsRoleModalOpen(true)}>
                      Create Custom Role
                    </Button>
                  </div>

                  <Table
                    dataSource={roles}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: 'Role Name',
                        dataIndex: 'displayName',
                        render: (name: string, record: any) => (
                          <Space size={8}>
                            <Text strong style={{ color: '#0F172A' }}>{name}</Text>
                            {record.isSystem && <Tag color="purple">System Default</Tag>}
                          </Space>
                        ),
                      },
                      {
                        title: 'Description',
                        dataIndex: 'description',
                        render: (desc: string) => <span style={{ color: '#64748B', fontSize: 13 }}>{desc}</span>,
                      },
                      {
                        title: 'Active Permissions',
                        dataIndex: 'permissionCount',
                        render: (cnt: number) => <Tag color="cyan">{cnt} Permissions Active</Tag>,
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_: any, record: any) => (
                          <Space size={8}>
                            <Button size="small" type="text" icon={<Edit2 size={14} />} />
                            {!record.isSystem && (
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<Trash2 size={14} />}
                                onClick={() => {
                                  setRoles(roles.filter((r) => r.id !== record.id));
                                  message.info('Role deleted');
                                }}
                              />
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'modules',
              label: (
                <Space size={6}>
                  <Puzzle size={16} />
                  Clinic Modules
                </Space>
              ),
              children: (
                <div style={{ padding: '24px 0', maxWidth: 680 }}>
                  <Text strong style={{ fontSize: 16, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                    Feature & Workflow Modules
                  </Text>
                  <Paragraph style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
                    Enable or disable optional clinic modules within your licensed platform entitlements.
                  </Paragraph>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {modules.map((mod) => (
                      <div
                        key={mod.key}
                        style={{
                          padding: 16,
                          borderRadius: 10,
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ color: '#0F172A' }}>{mod.name}</Text>
                            {mod.core && <Tag color="default">Core Essential</Tag>}
                          </div>
                          <Text style={{ color: '#64748B', fontSize: 12 }}>
                            {mod.key === 'before_after'
                              ? 'Side-by-side photographic clinical records for aesthetic & rehabilitative follow-ups'
                              : 'Standard operational component governed by role permissions'}
                          </Text>
                        </div>
                        <Switch
                          checked={mod.enabled}
                          disabled={mod.core}
                          onChange={(checked) => {
                            setModules(modules.map((m) => (m.key === mod.key ? { ...m, enabled: checked } : m)));
                            message.success(`${mod.name} is now ${checked ? 'enabled' : 'disabled'}`);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'backup',
              label: (
                <Space size={6}>
                  <Database size={16} />
                  نسخ احتياطي
                </Space>
              ),
              children: (
                <div style={{ padding: '24px 0', maxWidth: 720 }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>النسخ الاحتياطي وتصدير البيانات</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      قم بتنزيل نسخة كاملة من بيانات العيادة بضغطة واحدة. احفظها على جهازك أو على USB لضمان سلامة بياناتك.
                    </div>
                  </div>

                  {/* One-click backup button */}
                  <div
                    style={{
                      padding: '28px 24px',
                      borderRadius: 14,
                      backgroundColor: '#EFF6FF',
                      border: '2px dashed #93C5FD',
                      textAlign: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <HardDrive size={40} color="#2563EB" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>
                      نسخة احتياطية فورية
                    </div>
                    <div style={{ fontSize: 13, color: '#1D4ED8', marginBottom: 20 }}>
                      تصدير كامل البيانات (مرضى، مواعيد، فواتير، وصفات، إعدادات) في ملف JSON
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      icon={<Download size={18} />}
                      style={{ height: 48, paddingInline: 32, borderRadius: 10, fontSize: 15, fontWeight: 600, backgroundColor: '#2563EB' }}
                      onClick={() => {
                        // Collect all localStorage clinic data
                        const backup: Record<string, any> = {
                          exportedAt: new Date().toISOString(),
                          version: '1.0.0',
                          data: {},
                        };
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key) {
                            try {
                              backup.data[key] = JSON.parse(localStorage.getItem(key) || '""');
                            } catch {
                              backup.data[key] = localStorage.getItem(key);
                            }
                          }
                        }
                        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        message.success('✅ تم تنزيل النسخة الاحتياطية بنجاح على جهازك');
                      }}
                    >
                      <Database size={18} style={{ marginInlineEnd: 8 }} />
                      تنزيل نسخة احتياطية الآن
                    </Button>
                  </div>

                  {/* Info cards */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { icon: <ShieldCheck size={18} />, title: 'بياناتك في أمان', desc: 'الملف المصدَّر يحتوي على كل البيانات المحلية ولا يُرسل لأي خادم خارجي.', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
                      { icon: <HardDrive size={18} />, title: 'احفظه على USB', desc: 'يُنصح بنسخ الملف على USB أو Google Drive كل أسبوع على الأقل.', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                      { icon: <RefreshCw size={18} />, title: 'نسخ منتظمة', desc: 'اضبط تذكيراً أسبوعياً لتنزيل نسخة احتياطية وحماية بياناتك.', color: '#6D28D9', bg: '#EDE9FE', border: '#C4B5FD' },
                    ].map((info, i) => (
                      <div
                        key={i}
                        style={{
                          flex: '1 1 200px',
                          padding: '14px 16px',
                          borderRadius: 10,
                          backgroundColor: info.bg,
                          border: `1px solid ${info.border}`,
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                        }}
                      >
                        <span style={{ color: info.color, flexShrink: 0, marginTop: 2 }}>{info.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: info.color, marginBottom: 3 }}>{info.title}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{info.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Create Custom Role Modal */}
      <Modal
        title="Create Custom Clinic Role"
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item label="Role Title" name="displayName" rules={[{ required: true, message: 'Please enter a role title' }]}>
            <Input placeholder="e.g. Lead Physiotherapist / Cashier Manager" size="large" />
          </Form.Item>

          <Form.Item label="Operational Scope / Description" name="description">
            <Input.TextArea placeholder="Describe the responsibilities associated with this role" rows={2} />
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: 13, color: '#64748B', margin: '16px 0' }}>
            Select Granular Permissions ({selectedPermissions.length} selected)
          </Divider>

          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 8 }}>
            {SYSTEM_PERMISSION_CATEGORIES.map((cat) => (
              <div key={cat.category} style={{ marginBottom: 16 }}>
                <Text strong style={{ color: '#0F172A', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  {cat.category}
                </Text>
                <Row gutter={[8, 8]}>
                  {cat.permissions.map((p) => {
                    const isChecked = selectedPermissions.includes(p.key);
                    return (
                      <Col span={12} key={p.key}>
                        <div
                          onClick={() => {
                            if (isChecked) {
                              setSelectedPermissions(selectedPermissions.filter((k) => k !== p.key));
                            } else {
                              setSelectedPermissions([...selectedPermissions, p.key]);
                            }
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: isChecked ? '1px solid #2563EB' : '1px solid #E2E8F0',
                            backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            color: isChecked ? '#1E40AF' : '#475569',
                          }}
                        >
                          <Checkbox checked={isChecked} />
                          <span>{p.label}</span>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Save Role & Authority
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Comprehensive Staff User Account & Permissions Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="#2563EB" />
            <span>
              {editingStaffId ? 'Edit Staff Account & Permissions' : 'Create Staff Login & Configure Permissions'}
            </span>
          </div>
        }
        open={isStaffModalOpen}
        onCancel={() => {
          setIsStaffModalOpen(false);
          setEditingStaffId(null);
        }}
        footer={null}
        width={680}
      >
        <Form form={staffForm} layout="vertical" onFinish={handleSaveStaff}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'First name is required' }]}
              >
                <Input size="large" placeholder="e.g. Sarah" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Last name is required' }]}
              >
                <Input size="large" placeholder="e.g. El-Kady" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Username / Login Identifier"
                name="username"
                rules={[{ required: true, message: 'Login username/email is required' }]}
                extra="Staff will use this username to sign in"
              >
                <Input size="large" placeholder="e.g. sarah@clinic.com or sarah.doctor" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>Login Password</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<RefreshCw size={12} />}
                      onClick={handleGenerateRandomPassword}
                      style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    >
                      Generate Password
                    </Button>
                  </div>
                }
                name="password"
                rules={editingStaffId ? [] : [{ required: true, message: 'Password is required' }]}
                extra={editingStaffId ? 'Leave blank to keep existing password' : 'Initial password for staff member'}
              >
                <Input
                  type={showStaffPassword ? 'text' : 'password'}
                  size="large"
                  placeholder="Set account password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showStaffPassword ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                    </button>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Assigned Clinical Role"
                name="role"
                rules={[{ required: true, message: 'Please select a role' }]}
                extra="Selecting a role auto-configures default permissions"
              >
                <Select size="large" placeholder="Select role" onChange={handleRoleChange}>
                  {Object.keys(ROLE_DEFAULT_PERMISSIONS).map((roleName) => (
                    <Option key={roleName} value={roleName}>
                      {roleName}
                    </Option>
                  ))}
                  {roles
                    .filter((r) => !ROLE_DEFAULT_PERMISSIONS[r.displayName])
                    .map((r) => (
                      <Option key={r.id} value={r.displayName}>
                        {r.displayName}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Phone" name="phone">
                <Input size="large" placeholder="+20 100 000 0000" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0 16px' }} />

          {/* Granular Permissions Builder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <Text strong style={{ color: '#0F172A', fontSize: 14 }}>
                  Granted Permissions & Capabilities
                </Text>
                <div style={{ color: '#64748B', fontSize: 12 }}>
                  Fine-tune what this user is allowed to view, create, amend, or manage
                </div>
              </div>
              <Space>
                <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                  {selectedStaffPermissions.length} Active Permissions
                </Tag>
                <Button
                  size="small"
                  onClick={() => {
                    const allPerms = SYSTEM_PERMISSION_CATEGORIES.flatMap((c) => c.permissions.map((p) => p.key));
                    setSelectedStaffPermissions(allPerms);
                  }}
                >
                  Select All
                </Button>
                <Button size="small" onClick={() => setSelectedStaffPermissions([])}>
                  Clear All
                </Button>
              </Space>
            </div>

            <div
              style={{
                maxHeight: 280,
                overflowY: 'auto',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              {SYSTEM_PERMISSION_CATEGORIES.map((cat) => (
                <div key={cat.category} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 6,
                    }}
                  >
                    {cat.category}
                  </div>
                  <Row gutter={[8, 8]}>
                    {cat.permissions.map((p) => {
                      const isChecked = selectedStaffPermissions.includes(p.key);
                      return (
                        <Col span={12} key={p.key}>
                          <div
                            onClick={() => {
                              if (isChecked) {
                                setSelectedStaffPermissions(selectedStaffPermissions.filter((k) => k !== p.key));
                              } else {
                                setSelectedStaffPermissions([...selectedStaffPermissions, p.key]);
                              }
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: isChecked ? '1px solid #2563EB' : '1px solid #E2E8F0',
                              backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 12,
                              color: isChecked ? '#1E40AF' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Checkbox checked={isChecked} />
                            <span>{p.label}</span>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              onClick={() => {
                setIsStaffModalOpen(false);
                setEditingStaffId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 150 }}>
              {editingStaffId ? 'Save Changes' : 'Create Staff Account'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Staff Login Credentials Handover Card Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="#047857" />
            <span>Staff Account Login Credentials</span>
          </div>
        }
        open={!!credentialsModal?.visible}
        onCancel={() => setCredentialsModal(null)}
        footer={[
          <Button key="close" onClick={() => setCredentialsModal(null)}>
            إغلاق
          </Button>,
          <Button
            key="whatsapp"
            style={{
              backgroundColor: '#25D366',
              borderColor: '#25D366',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
            icon={<MessageSquare size={14} />}
            onClick={() => {
              if (credentialsModal) {
                const clinicTitle = clinic?.name || 'العيادة';
                const msg = encodeURIComponent(
                  `مرحباً ${credentialsModal.name}\nإليك بيانات حسابك الجديد في ${clinicTitle}:\n\n- اسم المستخدم: ${credentialsModal.username}\n- كلمة المرور: ${credentialsModal.password || 'كما حُددت من الإدارة'}\n- الصلاحية: ${credentialsModal.role}\n\nيمكنك تسجيل الدخول الآن إلى النظام.`
                );
                const cleanPhone = (credentialsModal.phone || '').replace(/\D/g, '');
                const cleanNumber = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone.startsWith('2') ? cleanPhone : cleanPhone ? '2' + cleanPhone : '';
                const waUrl = cleanNumber ? `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
                window.open(waUrl, '_blank');
              }
            }}
          >
            إرسال بالواتساب للموظف
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={<Copy size={14} />}
            onClick={() => {
              if (credentialsModal) {
                handleCopyCredentials({
                  name: credentialsModal.name,
                  username: credentialsModal.username,
                  password: credentialsModal.password,
                  role: credentialsModal.role,
                });
              }
            }}
          >
            نسخ البيانات
          </Button>,
        ]}
        width={500}
      >
        {credentialsModal && (
          <div style={{ padding: '12px 0' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: 12,
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginBottom: 4 }}>
                Account Ready for Use
              </div>
              <div style={{ fontSize: 12, color: '#15803D' }}>
                Share these login details securely with the staff member to sign in to the clinic workspace.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Staff Member:</span>
                <strong style={{ color: '#0F172A' }}>{credentialsModal.name}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Username / Email:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                  {credentialsModal.username}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Password:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#047857', fontSize: 14 }}>
                  {credentialsModal.password || '••••••••'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Assigned Role:</span>
                <Tag color="blue">{credentialsModal.role}</Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 13 }}>Granted Permissions:</span>
                <Tag color="cyan">{credentialsModal.permissionCount} Permissions Configured</Tag>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
