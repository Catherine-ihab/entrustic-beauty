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
} from 'antd';
import { Plus, Search, Pill } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { IDrug } from '@clinic/shared-types';

const { Title, Text } = Typography;

interface DrugRow extends IDrug {
  key: string;
}

export function DrugsManager() {
  const [rows, setRows] = useState<DrugRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async (query = '') => {
    setLoading(true);
    try {
      const res: any = await apiClient.get(`/drugs?q=${encodeURIComponent(query)}`);
      setRows((res.data ?? []).map((d: IDrug) => ({ ...d, key: d.id })));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res: any = await apiClient.post('/drugs', {
        name: values.name,
        genericName: values.genericName,
        category: values.category,
        form: values.form,
        strength: values.strength,
        substances: typeof values.substances === 'string'
          ? values.substances.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        commonDoses: values.commonDoses,
      });
      setModalOpen(false);
      form.resetFields();
      await load(q);
      message.success(`Drug "${res.data?.name ?? values.name}" added to catalog`);
    } catch (e: any) {
      if (e?.message) message.error(e.message?.replace?.('Bad Request Exception: ', '') ?? 'Failed to add drug');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Drug',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, r: DrugRow) => (
        <Space direction="vertical" size={0}>
          <strong style={{ fontSize: 13, color: '#0F172A' }}>{r.name}</strong>
          {r.genericName ? <Text style={{ fontSize: 11, color: '#64748B' }}>{r.genericName}</Text> : null}
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v?: string) => (v ? <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> : '—'),
    },
    {
      title: 'Form',
      dataIndex: 'form',
      key: 'form',
      render: (v?: string) => v ?? '—',
    },
    {
      title: 'Strength',
      dataIndex: 'strength',
      key: 'strength',
      render: (v?: string) => v ?? '—',
    },
    {
      title: 'Allergy / Interaction Keys',
      dataIndex: 'substances',
      key: 'substances',
      render: (v?: string[]) =>
        v && v.length > 0 ? (
          <Space size={[4, 4]} wrap>
            {v.map((s) => (
              <Tag key={s} style={{ fontSize: 10, backgroundColor: '#FFF7ED', borderColor: '#FDBA74', color: '#9A3412', margin: 0 }}>
                {s}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text style={{ fontSize: 11, color: '#64748B' }}>—</Text>
        ),
    },
    {
      title: 'Common Doses',
      dataIndex: 'commonDoses',
      key: 'commonDoses',
      render: (v?: string) => <Text style={{ fontSize: 11, color: '#475569' }}>{v ?? '—'}</Text>,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill size={20} color="#2563EB" /> Drug Catalog
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            Feeds the smart prescription composer — substances drive allergy &amp; interaction alerts.
          </Text>
        </div>
        <Button type="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)} style={{ borderRadius: 8 }}>
          Add Drug
        </Button>
      </div>

      <Input
        prefix={<Search size={15} color="#64748B" />}
        placeholder="Search by name, generic, or category…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ borderRadius: 8, marginBottom: 16, maxWidth: 420 }}
        allowClear
      />

      <Table
        loading={loading}
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={{ pageSize: 12, showSizeChanger: false }}
        bordered
        style={{ background: '#FFF', borderRadius: 12, overflow: 'hidden' }}
      />

      <Modal
        title="Add Drug to Catalog"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        okText="Add Drug"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Trade name" rules={[{ required: true, message: 'Trade name is required' }]}>
            <Input placeholder="e.g. Augmentin" />
          </Form.Item>
          <Form.Item name="genericName" label="Generic name (substance)">
            <Input placeholder="e.g. Amoxicillin / Clavulanate" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="category" label="Category" style={{ width: '50%' }}>
              <Input placeholder="Antibiotic" />
            </Form.Item>
            <Form.Item name="form" label="Form" style={{ width: '25%' }}>
              <Input placeholder="Tablet" />
            </Form.Item>
            <Form.Item name="strength" label="Strength" style={{ width: '25%' }}>
              <Input placeholder="625 mg" />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="substances" label="Allergy / interaction keys (comma separated)">
            <Input placeholder="amoxicillin, clavulanate, penicillin, beta-lactam" />
          </Form.Item>
          <Form.Item name="commonDoses" label="Common doses / directions">
            <Input placeholder="1 tab 2–3x/day with food" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}