import { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Modal,
  Form,
  Typography,
  message,
  Tabs,
  Select,
  Switch,
  InputNumber,
  Alert,
  Tooltip,
} from 'antd';
import {
  Send,
  RefreshCw,
  Search,
  Plus,
  XCircle,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import dayjs from 'dayjs';
import { apiClient } from '../../lib/api-client';
import {
  INotification,
  INotificationTemplate,
  IReminderSettings,
} from '@clinic/shared-types';

const { Title, Text } = Typography;

/** Extract a readable message from the API error envelope (or a plain string). */
const errMsg = (e: any): string =>
  e?.errors?.[0]?.message ?? e?.message ?? (typeof e === 'string' ? e : 'Request failed');

const STATUS_COLOR: Record<string, string> = {
  queued: 'blue',
  sending: 'processing',
  sent: 'green',
  failed: 'red',
  cancelled: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const CHANNEL_COLOR: Record<string, string> = {
  sms: 'geekblue',
  whatsapp: 'green',
};

interface PatientOption {
  id: string;
  first_name?: string;
  last_name?: string;
  patient_number?: string;
  phone?: string;
}

export function NotificationsManager() {
  const [activeTab, setActiveTab] = useState('outbox');

  // ── Outbox ──
  const [list, setList] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [runDueLoading, setRunDueLoading] = useState(false);

  // ── Send modal ──
  const [sendOpen, setSendOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [sendForm] = Form.useForm();

  // ── Templates ──
  const [templates, setTemplates] = useState<INotificationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editTpl, setEditTpl] = useState<INotificationTemplate | null>(null);
  const [tplForm] = Form.useForm();

  // ── Settings ──
  const [settings, setSettings] = useState<IReminderSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [quietStart, setQuietStart] = useState<string>('');
  const [quietEnd, setQuietEnd] = useState<string>('');

  const loadOutbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (channelFilter) params.set('channel', channelFilter);
      if (search.trim()) params.set('q', search.trim());
      const res: any = await apiClient.get(`/notifications?${params.toString()}`);
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, search]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res: any = await apiClient.get('/notifications/templates');
      setTemplates(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      message.error(errMsg(e));
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res: any = await apiClient.get('/notifications/settings');
      const s = res?.data ?? null;
      setSettings(s);
      setQuietStart(s?.quietHoursStart ?? '');
      setQuietEnd(s?.quietHoursEnd ?? '');
    } catch (e: any) {
      message.error(errMsg(e));
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const res: any = await apiClient.get('/patients?limit=100');
      setPatients(Array.isArray(res?.data) ? res.data : []);
    } catch {
      // patient picker degrades gracefully — send modal still opens
    }
  }, []);

  useEffect(() => {
    void loadOutbox();
    void loadTemplates();
    void loadSettings();
    void loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const onRunDue = async () => {
    setRunDueLoading(true);
    try {
      const res: any = await apiClient.post('/notifications/run-due', {});
      const d = res?.data ?? {};
      message.success(
        `Sweep complete — queued: ${d.queued ?? 0}, sent: ${d.sent ?? 0}, errors: ${d.failed ?? 0}`,
      );
      await loadOutbox();
    } catch (e: any) {
      message.error(errMsg(e));
    } finally {
      setRunDueLoading(false);
    }
  };

  const onSend = async () => {
    let values: any;
    try {
      values = await sendForm.validateFields();
    } catch {
      return;
    }
    setSendLoading(true);
    try {
      const created: any = await apiClient.post('/notifications', {
        patientId: values.patientId,
        channel: values.channel,
        body: values.body,
      });
      const d = created?.data;
      if (d?.status === 'sent') {
        message.success('Message sent');
      } else if (d?.status === 'failed') {
        message.warning(`Send failed: ${d.error ?? 'unknown error'}`);
      } else {
        message.info(`Message queued (${d?.status ?? 'queued'})`);
      }
      setSendOpen(false);
      sendForm.resetFields();
      await loadOutbox();
    } catch (e: any) {
      message.error(errMsg(e));
    } finally {
      setSendLoading(false);
    }
  };

  const onRetry = async (id: string) => {
    try {
      const row: any = await apiClient.post(`/notifications/${id}/retry`, {});
      const d = row?.data;
      if (d?.status === 'sent') message.success('Message re-sent');
      else if (d?.status === 'failed') message.warning(`Send failed: ${d.error ?? 'unknown error'}`);
      else message.info('Message re-queued');
      await loadOutbox();
    } catch (e: any) {
      message.error(errMsg(e));
    }
  };

  const onCancel = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/cancel`, {});
      message.success('Message cancelled');
      await loadOutbox();
    } catch (e: any) {
      message.error(errMsg(e));
    }
  };

  const onTplSave = async () => {
    let values: any;
    try {
      values = await tplForm.validateFields();
    } catch {
      return;
    }
    try {
      await apiClient.patch(`/notifications/templates/${editTpl!.id}`, {
        name: values.name,
        body: values.body,
        isActive: values.isActive,
      });
      message.success('Template saved');
      setEditTpl(null);
      tplForm.resetFields();
      await loadTemplates();
    } catch (e: any) {
      message.error(errMsg(e));
    }
  };

  const onSettingsSave = async () => {
    if (!settings) return;
    const hasStart = !!quietStart;
    const hasEnd = !!quietEnd;
    if (hasStart !== hasEnd) {
      message.error('Quiet hours must have both a start and an end time (or be left empty)');
      return;
    }
    setSettingsSaving(true);
    try {
      const payload: any = {
        appointmentReminders: settings.appointmentReminders,
        reminderMinutesBefore: settings.reminderMinutesBefore,
        smsEnabled: settings.smsEnabled,
        whatsappEnabled: settings.whatsappEnabled,
        maxAttempts: settings.maxAttempts,
      };
      if (hasStart && hasEnd) {
        payload.quietHoursStart = quietStart.length === 5 ? `${quietStart}:00` : quietStart;
        payload.quietHoursEnd = quietEnd.length === 5 ? `${quietEnd}:00` : quietEnd;
      } else {
        payload.quietHoursStart = null;
        payload.quietHoursEnd = null;
      }
      const res: any = await apiClient.put('/notifications/settings', payload);
      const s = res?.data ?? null;
      setSettings(s);
      setQuietStart(s?.quietHoursStart ?? '');
      setQuietEnd(s?.quietHoursEnd ?? '');
      message.success('Reminder settings saved');
    } catch (e: any) {
      message.error(errMsg(e));
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const outboxColumns = [
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: 'Patient',
      key: 'patient',
      width: 170,
      render: (_: any, r: INotification) => (
        <span>
          <Text strong>{r.patientName || '—'}</Text>
          {r.patientNumber && (
            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
              {r.patientNumber}
            </Text>
          )}
        </span>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 105,
      render: (c: string) => (
        <Tag color={CHANNEL_COLOR[c]}>{c === 'whatsapp' ? 'WhatsApp' : 'SMS'}</Tag>
      ),
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 130,
    },
    {
      title: 'Message',
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text>{v}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 125,
      render: (_: any, r: INotification) => (
        <Space size={4}>
          <Tag color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status] ?? r.status}</Tag>
          {r.attempts > 1 && <Text type="secondary">×{r.attempts}</Text>}
        </Space>
      ),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      width: 150,
      ellipsis: true,
      render: (v?: string) =>
        v ? (
          <Tooltip title={v}>
            <Text type="danger">{v}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_: any, r: INotification) => (
        <Space size={4}>
          {(r.status === 'failed' || r.status === 'cancelled') && (
            <Tooltip title="Retry send">
              <Button
                size="small"
                icon={<RotateCcw size={13} />}
                onClick={() => void onRetry(r.id)}
              />
            </Tooltip>
          )}
          {(r.status === 'queued' || r.status === 'failed') && (
            <Tooltip title="Cancel">
              <Button
                size="small"
                danger
                icon={<XCircle size={13} />}
                onClick={() => void onCancel(r.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const templateColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (v: string, r: INotificationTemplate) => (
        <span>
          <Text strong>{v}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
            {r.key}
          </Text>
        </span>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 110,
      render: (c: string) => (
        <Tag color={CHANNEL_COLOR[c]}>{c === 'whatsapp' ? 'WhatsApp' : 'SMS'}</Tag>
      ),
    },
    {
      title: 'Body',
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text>{v}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) =>
        v ? <Tag color="green">Active</Tag> : <Tag>Disabled</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: any, r: INotificationTemplate) => (
        <Button
          size="small"
          icon={<Pencil size={13} />}
          onClick={() => {
            setEditTpl(r);
            tplForm.setFieldsValue({
              name: r.name,
              body: r.body,
              isActive: r.isActive,
            });
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  // ── Panes ─────────────────────────────────────────────────────────────────

  const outboxPane = (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Input
          placeholder="Search recipient or message…"
          prefix={<Search size={14} />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => void loadOutbox()}
          style={{ width: 260 }}
        />
        <Select
          placeholder="Status"
          allowClear
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v ?? '')}
          style={{ width: 130 }}
          options={['queued', 'sending', 'sent', 'failed', 'cancelled'].map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
        />
        <Select
          placeholder="Channel"
          allowClear
          value={channelFilter || undefined}
          onChange={(v) => setChannelFilter(v ?? '')}
          style={{ width: 130 }}
          options={[
            { value: 'sms', label: 'SMS' },
            { value: 'whatsapp', label: 'WhatsApp' },
          ]}
        />
        <Button icon={<RefreshCw size={14} />} onClick={() => void loadOutbox()}>
          Refresh
        </Button>
        <Button
          type="primary"
          ghost
          icon={<Send size={14} />}
          loading={runDueLoading}
          onClick={() => void onRunDue()}
        >
          Run due now
        </Button>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setSendOpen(true)}>
          Send message
        </Button>
      </Space>

      <Table
        rowKey="id"
        size="small"
        columns={outboxColumns}
        dataSource={list}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 1100 }}
      />
    </Space>
  );

  const templatesPane = (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Text type="secondary">
        Placeholders:{' '}
        <Text code>{'{{patient_name}}'}</Text> <Text code>{'{{clinic_name}}'}</Text>{' '}
        <Text code>{'{{date}}'}</Text> <Text code>{'{{time}}'}</Text> — used when the sweep
        renders appointment reminders.
      </Text>
      <Table
        rowKey="id"
        size="small"
        columns={templateColumns}
        dataSource={templates}
        loading={templatesLoading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 900 }}
      />
    </Space>
  );

  const settingsPane = settings ? (
    <Space direction="vertical" style={{ width: '100%', maxWidth: 640 }} size="middle">
      <Alert
        type="info"
        showIcon
        message="Outbound delivery is server-configured"
        description="The sending driver is chosen with the SMS_PROVIDER / WHATSAPP_PROVIDER environment variables (console | twilio | meta). The default 'console' driver logs messages without delivering — ideal for demos and development."
      />

      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space>
          <Text strong>Automatic appointment reminders</Text>
          <Switch
            checked={settings.appointmentReminders}
            onChange={(v) => setSettings({ ...settings, appointmentReminders: v })}
          />
        </Space>
        <Space>
          <Text>Remind before appointment (minutes)</Text>
          <InputNumber
            min={1}
            max={10080}
            value={settings.reminderMinutesBefore}
            onChange={(v) =>
              setSettings({ ...settings, reminderMinutesBefore: v ?? settings.reminderMinutesBefore })
            }
          />
          <Text type="secondary">1440 = one day ahead</Text>
        </Space>
        <Space>
          <Text strong>SMS channel</Text>
          <Switch
            checked={settings.smsEnabled}
            onChange={(v) => setSettings({ ...settings, smsEnabled: v })}
          />
          <Text strong>WhatsApp channel</Text>
          <Switch
            checked={settings.whatsappEnabled}
            onChange={(v) => setSettings({ ...settings, whatsappEnabled: v })}
          />
        </Space>
        <Space>
          <Text>Quiet hours (no sweep sends)</Text>
          <Input
            placeholder="20:00"
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            style={{ width: 90 }}
          />
          <Text>to</Text>
          <Input
            placeholder="08:00"
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
            style={{ width: 90 }}
          />
          <Text type="secondary">empty = off; overnight windows supported</Text>
        </Space>
        <Space>
          <Text>Max delivery attempts</Text>
          <InputNumber
            min={1}
            max={10}
            value={settings.maxAttempts}
            onChange={(v) => setSettings({ ...settings, maxAttempts: v ?? settings.maxAttempts })}
          />
          <Text type="secondary">before a message is parked as failed</Text>
        </Space>
      </Space>

      <Button
        type="primary"
        loading={settingsSaving}
        onClick={() => void onSettingsSave()}
      >
        Save settings
      </Button>
    </Space>
  ) : (
    <Text type="secondary">Loading settings…</Text>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <Space style={{ marginBottom: 16 }} align="start">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Reminders & Messaging
          </Title>
          <Text type="secondary">
            Appointment reminders and outbound patient messages over SMS / WhatsApp.
          </Text>
        </div>
      </Space>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'outbox', label: 'Outbox', children: outboxPane },
          { key: 'templates', label: 'Templates', children: templatesPane },
          { key: 'settings', label: 'Settings', children: settingsPane },
        ]}
      />

      {/* Send message modal */}
      <Modal
        title="Send message"
        open={sendOpen}
        onOk={() => void onSend()}
        onCancel={() => {
          setSendOpen(false);
          sendForm.resetFields();
        }}
        confirmLoading={sendLoading}
        okText="Send"
        width={560}
      >
        <Form form={sendForm} layout="vertical">
          <Form.Item
            name="patientId"
            label="Patient"
            rules={[{ required: true, message: 'Select a patient' }]}
          >
            <Select
              showSearch
              placeholder="Search patient…"
              optionFilterProp="label"
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.first_name ?? ''} ${p.last_name ?? ''} (${p.patient_number ?? 'no number'})`,
                disabled: !p.phone,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="channel"
            label="Channel"
            initialValue="whatsapp"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'sms', label: 'SMS' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="body"
            label="Message"
            rules={[{ required: true, message: 'Type the message' }]}
          >
            <Input.TextArea rows={4} maxLength={1000} showCount placeholder="Message text…" />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Manual messages send immediately and ignore quiet hours.
          </Text>
        </Form>
      </Modal>

      {/* Template edit modal */}
      <Modal
        title={editTpl ? `Edit template — ${editTpl.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}` : 'Edit template'}
        open={!!editTpl}
        onOk={() => void onTplSave()}
        onCancel={() => {
          setEditTpl(null);
          tplForm.resetFields();
        }}
        okText="Save"
        width={620}
      >
        <Form form={tplForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}>
            <Input.TextArea rows={5} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Placeholders:{' '}
            <Text code>{'{{patient_name}}'}</Text> <Text code>{'{{clinic_name}}'}</Text>{' '}
            <Text code>{'{{date}}'}</Text> <Text code>{'{{time}}'}</Text>
          </Text>
        </Form>
      </Modal>
    </div>
  );
}
