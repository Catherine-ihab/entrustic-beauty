import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Segmented,
  Select,
  Table,
  Tabs,
  Tag,
  Spin,
  Typography,
  DatePicker,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  LogOut,
  Receipt,
  Stethoscope,
  UserRound,
  Video,
} from 'lucide-react';
import {
  IPortalMe,
  IPortalSession,
  MeasurementTrend,
  PortalAppointment,
  PortalInvoice,
  PortalLabResult,
  PortalPrescription,
  PortalProviderOption,
  PortalServiceOption,
} from '@clinic/shared-types';
import {
  portalClient,
  PORTAL_SESSION_KEY,
  PORTAL_TOKEN_KEY,
} from '../../lib/portal-client';
import { TelemedRoom } from '../telemedicine/TelemedRoom';
import { VitalsTrendsGrid } from '../vitals/VitalsTrends';

const errMsg = (e: any) => e?.errors?.[0]?.message ?? e?.message ?? 'Something went wrong';

const { Text } = Typography;

/** Mirror the staff app's slug discovery so the portal pre-fills correctly. */
function deriveSlug(): string {
  try {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 2 && !['www', 'api', 'admin', 'app'].includes(parts[0])) {
      return parts[0];
    }
  } catch {
    /* ignore */
  }
  return localStorage.getItem('dev_tenant_slug') || 'demo';
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'blue',
  confirmed: 'geekblue',
  in_progress: 'purple',
  completed: 'green',
  cancelled: 'red',
  no_show: 'volcano',
  issued: 'blue',
  dispensed: 'green',
  paid: 'green',
  partially_paid: 'orange',
  overdue: 'red',
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────

function PortalLogin({ onSession }: { onSession: (s: IPortalSession) => void }) {
  const [form] = Form.useForm();
  const [step, setStep] = useState<'identify' | 'code'>('identify');
  const [slug, setSlug] = useState(deriveSlug());
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const requestCode = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      const res = await portalClient.post('/portal/auth/request-code', {
        clinicSlug: values.clinicSlug || slug,
        identifier: values.identifier,
        channel: 'sms',
      });
      const data = res?.data;
      setSlug(values.clinicSlug || slug);
      setIdentifier(values.identifier);
      setDevCode(data?.devCode ?? null);
      setRecipient(data?.recipient ?? '');
      setStep('code');
      message.success(`Code sent to ${data?.recipient ?? 'your phone'}`);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!code || code.length < 6) {
      message.warning('Enter the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const res = await portalClient.post('/portal/auth/verify', {
        clinicSlug: slug,
        identifier,
        code,
      });
      const session = res?.data as IPortalSession;
      localStorage.setItem(PORTAL_TOKEN_KEY, session.accessToken);
      localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
      onSession(session);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 10px 40px rgba(15,23,42,0.10)',
          padding: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Stethoscope size={24} />
          <h2 style={{ margin: 0 }}>Patient Portal</h2>
        </div>
        <p style={{ opacity: 0.65, marginTop: 4, marginBottom: 20 }}>
          Sign in with your phone number or email to see your appointments, prescriptions and
          results.
        </p>

        <Form form={form} layout="vertical" initialValues={{ clinicSlug: slug }}>
          <Form.Item
            name="clinicSlug"
            label="Clinic"
            rules={[{ required: true, message: 'Clinic code is required' }]}
          >
            <Input placeholder="clinic code (e.g. demo)" />
          </Form.Item>

          {step === 'identify' && (
            <>
              <Form.Item
                name="identifier"
                label="Phone or email"
                rules={[{ required: true, message: 'Enter your phone or email' }]}
              >
                <Input placeholder="+201000000000 or you@example.com" />
              </Form.Item>
              <Button type="primary" block loading={sending} onClick={requestCode}>
                Send login code
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              {devCode && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 14 }}
                  message={`Demo code: ${devCode}`}
                  description="This code was delivered by the demo messaging driver. In production it arrives by SMS."
                />
              )}
              <Form.Item label={`Code sent to ${recipient || 'your phone'}`}>
                <Input.OTP length={6} value={code} onChange={setCode} />
              </Form.Item>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  onClick={() => {
                    setCode('');
                    setStep('identify');
                  }}
                  style={{ flex: 1 }}
                >
                  Change details
                </Button>
                <Button
                  type="primary"
                  style={{ flex: 2 }}
                  loading={verifying}
                  onClick={verify}
                >
                  Sign in
                </Button>
              </div>
            </>
          )}
        </Form>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <a href="/">← Back to staff app</a>
        </div>
      </div>
    </div>
  );
}

// ─── APPOINTMENTS TAB ────────────────────────────────────────────────────────

function AppointmentsTab({ onJoin }: { onJoin: (appt: PortalAppointment) => void }) {
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const [rows, setRows] = useState<PortalAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<PortalProviderOption[]>([]);
  const [services, setServices] = useState<PortalServiceOption[]>([]);
  const [form] = Form.useForm();

  const load = useCallback(async (sc: 'upcoming' | 'past') => {
    setLoading(true);
    try {
      const res = await portalClient.get(`/portal/appointments?scope=${sc}`);
      setRows(res?.data ?? []);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(scope);
  }, [scope, load]);

  const openBooking = async () => {
    setOpen(true);
    if (providers.length === 0) {
      try {
        const [p, s] = await Promise.all([
          portalClient.get('/portal/providers'),
          portalClient.get('/portal/services'),
        ]);
        setProviders(p?.data ?? []);
        setServices(s?.data ?? []);
      } catch (e) {
        message.error(errMsg(e));
      }
    }
  };

  const submitBooking = async (values: any) => {
    setBooking(true);
    try {
      await portalClient.post('/portal/appointments', {
        providerId: values.providerId,
        serviceId: values.serviceId,
        visitType: values.visitType,
        startTime: (values.when as Dayjs).toISOString(),
        notes: values.notes,
      });
      message.success('Appointment booked!');
      setOpen(false);
      form.resetFields();
      void load(scope);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setBooking(false);
    }
  };

  const columns = [
    {
      title: 'When',
      key: 'when',
      render: (_: unknown, r: PortalAppointment) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(r.startTime).format('ddd, MMM D · HH:mm')}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            until {dayjs(r.endTime).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Clinician',
      dataIndex: 'providerName',
      key: 'provider',
    },
    {
      title: 'Service',
      dataIndex: 'serviceName',
      key: 'service',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Type',
      dataIndex: 'visitType',
      key: 'visitType',
      width: 130,
      render: (v: string) =>
        v === 'telemedicine' ? <Tag color="cyan">Telemedicine</Tag> : <Tag>In-person</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 140,
      render: (_: unknown, r: PortalAppointment) =>
        r.visitType === 'telemedicine' &&
        ['scheduled', 'confirmed'].includes(r.status) ? (
          <Button type="primary" size="small" icon={<Video size={14} />} onClick={() => onJoin(r)}>
            Join visit
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
        <Segmented
          value={scope}
          onChange={(v) => setScope(v as 'upcoming' | 'past')}
          options={[
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Past', value: 'past' },
          ]}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" onClick={openBooking}>
          Book appointment
        </Button>
      </div>

      <Table<PortalAppointment>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        locale={{ emptyText: 'No appointments here yet.' }}
      />

      <Modal
        open={open}
        title="Book an appointment"
        footer={null}
        destroyOnClose
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={submitBooking} initialValues={{ visitType: 'in_person' }}>
          <Form.Item name="providerId" label="Clinician" rules={[{ required: true }]}>
            <Select
              placeholder="Choose a clinician"
              options={providers.map((p) => ({ value: p.id, label: p.fullName }))}
            />
          </Form.Item>
          <Form.Item name="serviceId" label="Service (optional)">
            <Select
              allowClear
              placeholder="Choose a service"
              options={services.map((s) => ({
                value: s.id,
                label: `${s.name} · ${s.defaultDurationMinutes} min · ${s.currentPrice} ${s.currency}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="when" label="Date & time" rules={[{ required: true }]}>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
            />
          </Form.Item>
          <Form.Item name="visitType" label="Visit type">
            <Radio.Group
              options={[
                { label: 'In-person visit', value: 'in_person' },
                { label: 'Telemedicine (video)', value: 'telemedicine' },
              ]}
              optionType="button"
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes for the clinician (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={booking}>
            Confirm booking
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

// ─── RECORDS TABS ────────────────────────────────────────────────────────────

function usePortalList<T>(path: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portalClient.get(path);
      setRows(res?.data ?? []);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void load();
  }, [load]);
  return { rows, loading };
}

function PrescriptionsTab() {
  const { rows, loading } = usePortalList<PortalPrescription>('/portal/prescriptions');
  return (
    <Table<PortalPrescription>
      rowKey="id"
      loading={loading}
      dataSource={rows}
      pagination={false}
      locale={{ emptyText: 'No prescriptions yet.' }}
      expandable={{
        expandedRowRender: (r) => (
          <Table
            rowKey={(_x, i) => String(i)}
            size="small"
            pagination={false}
            dataSource={r.items}
            columns={[
              { title: 'Medicine', dataIndex: 'drugName' },
              { title: 'Dose', dataIndex: 'dose', render: (v) => v ?? '—' },
              { title: 'Frequency', dataIndex: 'frequency', render: (v) => v ?? '—' },
              { title: 'Duration', dataIndex: 'duration', render: (v) => v ?? '—' },
              { title: 'Quantity', dataIndex: 'quantity', render: (v) => v ?? '—' },
            ]}
          />
        ),
      }}
      columns={[
        {
          title: 'Issued',
          dataIndex: 'issuedAt',
          render: (v: string) => dayjs(v).format('MMM D, YYYY · HH:mm'),
        },
        { title: 'Doctor notes', dataIndex: 'notes', render: (v) => v || '—' },
        {
          title: 'Items',
          key: 'items',
          width: 100,
          render: (_: unknown, r) => <Tag>{r.items.length} medicine(s)</Tag>,
        },
        {
          title: 'Status',
          dataIndex: 'status',
          width: 120,
          render: (v: string) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag>,
        },
      ]}
    />
  );
}

function LabTab() {
  const { rows, loading } = usePortalList<PortalLabResult>('/portal/lab-results');
  return (
    <Table<PortalLabResult>
      rowKey="id"
      loading={loading}
      dataSource={rows}
      pagination={false}
      locale={{ emptyText: 'No lab results yet.' }}
      expandable={{
        expandedRowRender: (r) => (
          <Table
            rowKey={(_x, i) => String(i)}
            size="small"
            pagination={false}
            dataSource={r.items}
            columns={[
              { title: 'Test', dataIndex: 'testName' },
              { title: 'Result', dataIndex: 'value', render: (v) => v ?? 'pending' },
              { title: 'Unit', dataIndex: 'unit', render: (v) => v ?? '—' },
              {
                title: 'Flag',
                dataIndex: 'flag',
                render: (v) =>
                  v && v !== 'normal' ? <Tag color="red">{v}</Tag> : <Tag color="green">normal</Tag>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (v: string) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag>,
              },
            ]}
          />
        ),
      }}
      columns={[
        {
          title: 'Requested',
          dataIndex: 'createdAt',
          render: (v: string) => dayjs(v).format('MMM D, YYYY'),
        },
        { title: 'Request #', dataIndex: 'requestNumber' },
        {
          title: 'Priority',
          dataIndex: 'priority',
          width: 110,
          render: (v: string) =>
            v === 'routine' ? <Tag>routine</Tag> : <Tag color="orange">{v}</Tag>,
        },
        {
          title: 'Tests',
          key: 'tests',
          width: 130,
          render: (_: unknown, r) => <Tag>{r.items.length} test(s)</Tag>,
        },
        {
          title: 'Status',
          dataIndex: 'status',
          width: 130,
          render: (v: string) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag>,
        },
      ]}
    />
  );
}

function InvoicesTab({ currency }: { currency: string }) {
  const { rows, loading } = usePortalList<PortalInvoice>('/portal/invoices');
  return (
    <Table<PortalInvoice>
      rowKey="id"
      loading={loading}
      dataSource={rows}
      pagination={false}
      locale={{ emptyText: 'No invoices yet.' }}
      expandable={{
        expandedRowRender: (r) => (
          <Table
            rowKey={(_x, i) => String(i)}
            size="small"
            pagination={false}
            dataSource={r.items}
            columns={[
              { title: 'Description', dataIndex: 'description' },
              { title: 'Unit price', dataIndex: 'unitPrice' },
              { title: 'Qty', dataIndex: 'quantity' },
              { title: 'Line total', dataIndex: 'lineTotal' },
            ]}
          />
        ),
      }}
      columns={[
        { title: 'Invoice #', dataIndex: 'invoiceNumber' },
        { title: 'Date', dataIndex: 'issueDate', render: (v) => dayjs(v).format('MMM D, YYYY') },
        {
          title: 'Total',
          key: 'total',
          render: (_: unknown, r) => (
            <b>
              {r.total} {r.currency || currency}
            </b>
          ),
        },
        {
          title: 'Paid',
          key: 'paid',
          render: (_: unknown, r) => (
            <span>
              {r.paidAmount} {r.currency || currency}
            </span>
          ),
        },
        {
          title: 'Status',
          dataIndex: 'status',
          width: 140,
          render: (v: string) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag>,
        },
      ]}
    />
  );
}

function VitalsTab() {
  const [days, setDays] = useState(90);
  const { rows, loading } = usePortalList<MeasurementTrend>(`/portal/vitals?days=${days}`);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Text type="secondary">Your recorded measurements over time.</Text>
        <Segmented
          size="small"
          value={days}
          onChange={(v) => setDays(v as number)}
          options={[
            { label: '30 days', value: 30 },
            { label: '90 days', value: 90 },
            { label: '1 year', value: 365 },
            { label: 'All', value: 0 },
          ]}
        />
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <VitalsTrendsGrid trends={rows} emptyText="No measurements recorded yet." />
      )}
    </div>
  );
}

function ProfileTab() {
  const [me, setMe] = useState<IPortalMe | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    portalClient
      .get('/portal/me')
      .then((res) => setMe(res?.data ?? null))
      .catch((e) => message.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !me) return <div style={{ padding: 20, opacity: 0.6 }}>Loading profile…</div>;

  return (
    <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
      <Descriptions.Item label="Patient #">{me.patientNumber}</Descriptions.Item>
      <Descriptions.Item label="Name">{me.fullName}</Descriptions.Item>
      <Descriptions.Item label="Phone">{me.phone ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Email">{me.email ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Date of birth">{me.dateOfBirth ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Gender">{me.gender}</Descriptions.Item>
      <Descriptions.Item label="Blood type">{me.bloodType ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Address">{me.address ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Emergency contact">
        {me.emergencyContactName
          ? `${me.emergencyContactName} · ${me.emergencyContactPhone ?? ''}`
          : '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Allergies" span={2}>
        {me.allergies || me.activeAllergies.length > 0 ? (
          <>
            {me.allergies && <div>{me.allergies}</div>}
            {me.activeAllergies.map((a) => (
              <Tag key={a.allergen} color={a.severity === 'severe' ? 'red' : 'orange'}>
                {a.allergen}
                {a.reaction ? ` (${a.reaction})` : ''}
              </Tag>
            ))}
          </>
        ) : (
          'None recorded'
        )}
      </Descriptions.Item>
    </Descriptions>
  );
}

// ─── SHELL ───────────────────────────────────────────────────────────────────

export function PatientPortal() {
  const [session, setSession] = useState<IPortalSession | null>(() => {
    try {
      const raw = localStorage.getItem(PORTAL_SESSION_KEY);
      return raw ? (JSON.parse(raw) as IPortalSession) : null;
    } catch {
      return null;
    }
  });
  const [room, setRoom] = useState<PortalAppointment | null>(null);

  const logout = () => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    localStorage.removeItem(PORTAL_SESSION_KEY);
    setSession(null);
    setRoom(null);
  };

  if (!session) {
    return <PortalLogin onSession={setSession} />;
  }

  if (room) {
    return (
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <TelemedRoom
          api={portalClient}
          basePath={`/portal/rooms/${room.id}`}
          role="patient"
          title={`Video visit — ${room.providerName}`}
          subtitle={`${dayjs(room.startTime).format('ddd, MMM D · HH:mm')} · ${room.serviceName ?? 'Telemedicine visit'}`}
          onBack={() => setRoom(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Stethoscope size={22} />
        <div>
          <div style={{ fontWeight: 700 }}>Patient Portal</div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {session.patient.fullName} · {session.patient.patientNumber}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Button icon={<LogOut size={15} />} onClick={logout}>
          Sign out
        </Button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <Tabs
          defaultActiveKey="appointments"
          items={[
            {
              key: 'appointments',
              label: (
                <span>
                  <CalendarDays size={14} /> Appointments
                </span>
              ),
              children: <AppointmentsTab onJoin={setRoom} />,
            },
            {
              key: 'vitals',
              label: (
                <span>
                  <Activity size={14} /> Vitals
                </span>
              ),
              children: <VitalsTab />,
            },
            {
              key: 'prescriptions',
              label: (
                <span>
                  <ClipboardList size={14} /> Prescriptions
                </span>
              ),
              children: <PrescriptionsTab />,
            },
            {
              key: 'lab',
              label: (
                <span>
                  <FlaskConical size={14} /> Lab results
                </span>
              ),
              children: <LabTab />,
            },
            {
              key: 'invoices',
              label: (
                <span>
                  <Receipt size={14} /> Invoices
                </span>
              ),
              children: <InvoicesTab currency="EGP" />,
            },
            {
              key: 'profile',
              label: (
                <span>
                  <UserRound size={14} /> Profile
                </span>
              ),
              children: <ProfileTab />,
            },
          ]}
        />
      </div>
    </div>
  );
}
