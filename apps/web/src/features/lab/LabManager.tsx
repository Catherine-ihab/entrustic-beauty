import { useEffect, useState } from 'react';
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
  InputNumber,
} from 'antd';
import {
  Plus,
  Search,
  ClipboardCheck,
  XCircle,
  TestTube2,
} from 'lucide-react';
import dayjs from 'dayjs';
import { apiClient } from '../../lib/api-client';
import {
  ILabTest,
  ILabRequest,
  ILabRequestSummary,
  ILabRequestItem,
  LabRequestStatus,
  LabPriority,
} from '@clinic/shared-types';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  ordered: 'blue',
  collected: 'cyan',
  in_progress: 'gold',
  completed: 'green',
  cancelled: 'red',
};

const PRIORITY_COLOR: Record<string, string> = {
  routine: 'default',
  urgent: 'orange',
  stat: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  ordered: 'Ordered',
  collected: 'Collected',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
}

export function LabManager() {
  const [tab, setTab] = useState('requests');

  // ── Requests ───────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<ILabRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // ── Catalog ────────────────────────────────────────────────────────────
  const [tests, setTests] = useState<ILabTest[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catQ, setCatQ] = useState('');

  // ── New request modal ──────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [reqForm] = Form.useForm();

  // ── Detail / results ───────────────────────────────────────────────────
  const [detail, setDetail] = useState<ILabRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resultItem, setResultItem] = useState<ILabRequestItem | null>(null);
  const [resultForm] = Form.useForm();

  // ── Test add/edit ──────────────────────────────────────────────────────
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editTest, setEditTest] = useState<ILabTest | null>(null);
  const [testForm] = Form.useForm();

  const [saving, setSaving] = useState(false);

  const loadRequests = async (query = '', status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (status) params.set('status', status);
      const res: any = await apiClient.get(`/lab/requests?${params.toString()}`);
      setRequests(res.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async (query = '') => {
    setCatalogLoading(true);
    try {
      const res: any = await apiClient.get(`/lab/tests?q=${encodeURIComponent(query)}`);
      setTests(res.data ?? []);
    } catch {
      setTests([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res: any = await apiClient.get('/patients?limit=100');
      setPatients(res.data ?? []);
    } catch {
      setPatients([]);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadRequests(q, statusFilter), 250);
    return () => clearTimeout(t);
  }, [q, statusFilter]);

  useEffect(() => {
    loadTests(catQ);
  }, [catQ]);

  useEffect(() => {
    if (tab === 'catalog') loadTests(catQ);
  }, [tab]);

  // ── Create request ─────────────────────────────────────────────────────
  const openCreate = () => {
    reqForm.resetFields();
    loadPatients();
    setAddOpen(true);
  };

  const handleCreate = async () => {
    try {
      const v = await reqForm.validateFields();
      setSaving(true);
      await apiClient.post('/lab/requests', {
        patientId: v.patientId,
        priority: v.priority ?? 'routine',
        clinicalNotes: v.clinicalNotes,
        testIds: v.testIds,
      });
      setAddOpen(false);
      message.success('Lab request created');
      await loadRequests(q, statusFilter);
    } catch (e: any) {
      if (e?.message) message.error(e.message?.replace?.('Bad Request Exception: ', '') ?? 'Failed to create request');
    } finally {
      setSaving(false);
    }
  };

  // ── Detail modal ───────────────────────────────────────────────────────
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res: any = await apiClient.get(`/lab/requests/${id}`);
      setDetail(res.data ?? null);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detail) return;
    const res: any = await apiClient.get(`/lab/requests/${detail.id}`);
    setDetail(res.data ?? null);
    await loadRequests(q, statusFilter);
  };

  const handleRequestAction = async (status: LabRequestStatus) => {
    if (!detail) return;
    try {
      setSaving(true);
      await apiClient.patch(`/lab/requests/${detail.id}`, { status });
      await refreshDetail();
      message.success(status === 'cancelled' ? 'Request cancelled' : `Request marked ${status}`);
    } catch (e: any) {
      if (e?.message) message.error(e.message?.replace?.('Bad Request Exception: ', '') ?? 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Result entry ───────────────────────────────────────────────────────
  const openResult = (item: ILabRequestItem) => {
    setResultItem(item);
    resultForm.setFieldsValue({
      resultValue: item.resultValue,
      resultUnit: item.resultUnit,
      resultFlag: item.resultFlag,
      resultNotes: item.resultNotes,
    });
  };

  const handleSaveResult = async () => {
    if (!detail || !resultItem) return;
    try {
      const v = await resultForm.validateFields();
      setSaving(true);
      await apiClient.patch(`/lab/requests/${detail.id}/items/${resultItem.id}`, {
        status: v.resultValue ? 'completed' : undefined,
        resultValue: v.resultValue,
        resultUnit: v.resultUnit,
        resultFlag: v.resultFlag,
        resultNotes: v.resultNotes,
      });
      setResultItem(null);
      await refreshDetail();
      message.success('Result saved');
    } catch (e: any) {
      if (e?.message) message.error(e.message?.replace?.('Bad Request Exception: ', '') ?? 'Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  const handleItemStatus = async (item: ILabRequestItem, status: LabRequestStatus) => {
    if (!detail) return;
    try {
      setSaving(true);
      await apiClient.patch(`/lab/requests/${detail.id}/items/${item.id}`, { status });
      await refreshDetail();
      message.success(`Item marked ${status}`);
    } catch (e: any) {
      if (e?.message) message.error(e.message?.replace?.('Bad Request Exception: ', '') ?? 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Test catalog crud ──────────────────────────────────────────────────
  const openTestModal = (test?: ILabTest) => {
    setEditTest(test ?? null);
    testForm.resetFields();
    if (test) {
      testForm.setFieldsValue({
        name: test.name,
        category: test.category,
        sampleType: test.sampleType,
        sampleTube: test.sampleTube,
        unit: test.unit,
        referenceRange: test.referenceRange,
        turnaroundHours: test.turnaroundHours,
      });
    }
    setTestModalOpen(true);
  };

  const handleSaveTest = async () => {
    try {
      const v = await testForm.validateFields();
      setSaving(true);
      const payload = {
        name: v.name,
        category: v.category,
        sampleType: v.sampleType,
        sampleTube: v.sampleTube,
        unit: v.unit,
        referenceRange: v.referenceRange,
        turnaroundHours: v.turnaroundHours,
      };
      if (editTest) {
        await apiClient.patch(`/lab/tests/${editTest.id}`, payload);
      } else {
        await apiClient.post('/lab/tests', payload);
      }
      setTestModalOpen(false);
      await loadTests(catQ);
      message.success(editTest ? 'Test updated' : 'Test added');
    } catch (e: any) {
      if (e?.message) message.error(e.message?.replace?.('Bad Request Exception: ', '') ?? 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const requestColumns = [
    {
      title: 'Request',
      dataIndex: 'requestNumber',
      key: 'number',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (r: ILabRequestSummary) => (
        <Space direction="vertical" size={0}>
          <Text>{r.patientName || '—'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.patientNumber || ''}</Text>
        </Space>
      ),
    },
    {
      title: 'Tests',
      key: 'tests',
      render: (r: ILabRequestSummary) => (
        <Text>{r.completedCount}/{r.itemCount} done</Text>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: LabPriority) => <Tag color={PRIORITY_COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: LabRequestStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'requestedAt',
      key: 'created',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: ILabRequestSummary) => (
        <Space wrap>
          <Button size="small" icon={<ClipboardCheck size={14} />} onClick={() => openDetail(r.id)}>
            Open
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Lab Samples & Results</Title>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'requests',
            label: 'Lab Requests',
            children: (
              <>
                <Space style={{ marginBottom: 16 }} wrap>
                  <Input
                    allowClear
                    prefix={<Search size={14} />}
                    placeholder="Search patient or request no…"
                    style={{ width: 260 }}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <Select
                    allowClear
                    placeholder="Status"
                    style={{ width: 140 }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
                  />
                  <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
                    New Lab Request
                  </Button>
                </Space>

                <Table
                  size="middle"
                  rowKey="id"
                  columns={requestColumns as any}
                  dataSource={requests}
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'catalog',
            label: 'Test Catalog',
            children: (
              <>
                <Space style={{ marginBottom: 16 }} wrap>
                  <Input
                    allowClear
                    prefix={<Search size={14} />}
                    placeholder="Search tests…"
                    style={{ width: 260 }}
                    value={catQ}
                    onChange={(e) => setCatQ(e.target.value)}
                  />
                  <Button type="primary" icon={<Plus size={14} />} onClick={() => openTestModal()}>
                    Add Test
                  </Button>
                </Space>

                <Table
                  size="middle"
                  rowKey="id"
                  loading={catalogLoading}
                  dataSource={tests}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: 'Test',
                      dataIndex: 'name',
                      key: 'name',
                      render: (v: string, t: ILabTest) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{v}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t.sampleType || '—'} · {t.sampleTube || '—'}
                          </Text>
                        </Space>
                      ),
                    },
                    { title: 'Category', dataIndex: 'category', key: 'category', render: (v?: string) => v || '—' },
                    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (v?: string) => v || '—' },
                    { title: 'Reference range', dataIndex: 'referenceRange', key: 'ref', render: (v?: string) => v || '—' },
                    { title: 'TAT (hrs)', dataIndex: 'turnaroundHours', key: 'tat', render: (v?: number) => v ?? '—' },
                    {
                      title: 'Status',
                      dataIndex: 'isActive',
                      key: 'active',
                      render: (v: boolean) => (v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_: unknown, t: ILabTest) => (
                        <Button size="small" onClick={() => openTestModal(t)}>Edit</Button>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      {/* New Lab Request */}
      <Modal
        title="New Lab Request"
        open={addOpen}
        onOk={handleCreate}
        onCancel={() => setAddOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        width={560}
      >
        <Form form={reqForm} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Patient is required' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search patient…"
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.first_name} ${p.last_name} (${p.patient_number})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="routine">
            <Select
              options={[
                { value: 'routine', label: 'Routine' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'stat', label: 'STAT' },
              ]}
            />
          </Form.Item>
          <Form.Item name="testIds" label="Tests" rules={[{ required: true, message: 'Select at least one test' }]}>
            <Select
              mode="multiple"
              placeholder="Select tests…"
              optionFilterProp="label"
              options={tests.map((t) => ({ value: t.id, label: `${t.name} (${t.sampleType || '—'})` }))}
            />
          </Form.Item>
          <Form.Item name="clinicalNotes" label="Clinical notes">
            <Input.TextArea rows={2} placeholder="Clinical indication…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Request detail */}
      <Modal
        title={detail ? `Lab request ${detail.requestNumber}` : 'Lab request'}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={860}
      >
        {detail && (
          <>
            <Space style={{ marginBottom: 12 }} wrap>
              <Text strong>{detail.patientName || '—'}</Text>
              <Text type="secondary">{detail.patientNumber || ''}</Text>
              <Tag color={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</Tag>
              <Tag color={PRIORITY_COLOR[detail.priority]}>{detail.priority}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(detail.requestedAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </Space>

            {detail.clinicalNotes && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                {detail.clinicalNotes}
              </Text>
            )}

            {detail.status !== 'cancelled' && detail.status !== 'completed' && (
              <Space style={{ marginBottom: 12 }} wrap>
                {detail.status === 'ordered' && (
                  <Button size="small" icon={<TestTube2 size={14} />} onClick={() => handleRequestAction('collected')}>
                    Mark Collected
                  </Button>
                )}
                <Button size="small" danger icon={<XCircle size={14} />} onClick={() => handleRequestAction('cancelled')}>
                  Cancel Request
                </Button>
              </Space>
            )}

            <Table
              size="small"
              rowKey="id"
              loading={detailLoading}
              dataSource={detail.items}
              pagination={false}
              columns={[
                {
                  title: 'Test',
                  dataIndex: 'testName',
                  key: 'test',
                  render: (v: string, it: ILabRequestItem) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>{v}</Text>
                      {it.referenceRange && (
                        <Text type="secondary" style={{ fontSize: 12 }}>Ref: {it.referenceRange}</Text>
                      )}
                    </Space>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (v: LabRequestStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>,
                },
                {
                  title: 'Result',
                  key: 'result',
                  render: (_: unknown, it: ILabRequestItem) => (
                    <Space direction="vertical" size={0}>
                      {it.resultValue ? (
                        <>
                          <Text strong>
                            {it.resultValue} {it.resultUnit || ''}
                          </Text>
                          {it.resultFlag && (
                            <Tag color={it.resultFlag === 'high' ? 'red' : it.resultFlag === 'low' ? 'orange' : 'green'}>
                              {it.resultFlag}
                            </Tag>
                          )}
                        </>
                      ) : (
                        <Text type="secondary">—</Text>
                      )}
                      {it.resultNotes && <Text type="secondary" style={{ fontSize: 12 }}>{it.resultNotes}</Text>}
                    </Space>
                  ),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_: unknown, it: ILabRequestItem) => {
                    if (detail.status === 'cancelled') return null;
                    return (
                      <Space wrap>
                        {it.status !== 'completed' && (
                          <Button size="small" icon={<ClipboardCheck size={14} />} onClick={() => openResult(it)}>
                            {it.resultValue ? 'Edit Result' : 'Enter Result'}
                          </Button>
                        )}
                        {detail.status !== 'completed' && it.status === 'ordered' && (
                          <Button size="small" onClick={() => handleItemStatus(it, 'collected')}>
                            Collect
                          </Button>
                        )}
                      </Space>
                    );
                  },
                },
              ]}
            />
          </>
        )}
      </Modal>

      {/* Result entry */}
      <Modal
        title={`Result — ${resultItem?.testName ?? ''}`}
        open={!!resultItem}
        onOk={handleSaveResult}
        onCancel={() => setResultItem(null)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={resultForm} layout="vertical">
          <Form.Item name="resultValue" label="Value" rules={[{ required: true, message: 'Value is required' }]}>
            <Input placeholder="e.g. 12.8" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="resultUnit" label="Unit">
              <Input placeholder="g/dL, mg/dL…" />
            </Form.Item>
            <Form.Item name="resultFlag" label="Flag">
              <Select
                allowClear
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="resultNotes" label="Notes">
            <Input.TextArea rows={2} placeholder="Interpretation notes…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Test add / edit */}
      <Modal
        title={editTest ? `Edit: ${editTest.name}` : 'Add Lab Test'}
        open={testModalOpen}
        onOk={handleSaveTest}
        onCancel={() => setTestModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
        width={560}
      >
        <Form form={testForm} layout="vertical">
          <Form.Item name="name" label="Test name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Complete Blood Count (CBC)" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="category" label="Category">
              <Input placeholder="e.g. Hematology" />
            </Form.Item>
            <Form.Item name="unit" label="Unit">
              <Input placeholder="mg/dL, %…" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="sampleType" label="Sample type">
              <Select
                allowClear
                options={['Blood', 'Urine', 'Stool', 'Swab', 'Tissue', 'Other'].map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
            <Form.Item name="sampleTube" label="Sample tube / container">
              <Input placeholder="EDTA, Plain, Fluoride…" />
            </Form.Item>
          </div>
          <Form.Item name="referenceRange" label="Reference range">
            <Input placeholder="e.g. WBC 4.0–11.0" />
          </Form.Item>
          <Form.Item name="turnaroundHours" label="Turnaround time (hours)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}