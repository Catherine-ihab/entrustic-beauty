import { useState } from 'react';
import { Table, Tag, Typography, Card, Button, Input, Space } from 'antd';
import { ShieldCheck, RefreshCw, Search } from 'lucide-react';
import dayjs from 'dayjs';
import { useLang } from '../../lib/useLang';
import { useAuditLogs, type AuditLogRow } from './useAuditLogs';

const { Title, Text } = Typography;

const ACTION_COLOR_MAP: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'purple',
  LOGOUT: 'default',
};

/** Arabic labels for the seeded demo actions, which are not clinical verbs. */
const ACTION_LABELS: Record<string, string> = {
  'demo:seed': 'DEMO:SEED',
};

export function AuditLogsView() {
  const { tx } = useLang();
  const { logs, loading, error, refetch } = useAuditLogs();
  const [filter, setFilter] = useState('');

  const visible = filter.trim()
    ? logs.filter((l) =>
        [l.userEmail, l.action, l.entityType, l.entityId, l.ipAddress]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(filter.trim().toLowerCase())),
      )
    : logs;

  const columns = [
    {
      title: tx('التوقيت', 'Timestamp'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
          {dayjs(d).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      ),
    },
    {
      title: tx('المستخدم / المنفذ', 'User / Actor'),
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email: string) => <code style={{ fontSize: 12 }}>{email || '—'}</code>,
    },
    {
      title: tx('الإجراء', 'Action'),
      dataIndex: 'action',
      key: 'action',
      render: (act: string) => (
        <Tag color={ACTION_COLOR_MAP[act] || 'default'}>{ACTION_LABELS[act] || act}</Tag>
      ),
    },
    {
      title: tx('السجل المتأثر', 'Resource'),
      key: 'resource',
      render: (_: any, r: AuditLogRow) => (
        <span>
          <Tag color="cyan">{(r.entityType || '—').toUpperCase()}</Tag>
          {r.entityId && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {String(r.entityId).slice(0, 8)}
            </Text>
          )}
        </span>
      ),
    },
    {
      title: tx('عنوان IP', 'IP Address'),
      dataIndex: 'ipAddress',
      key: 'ip',
      render: (ip: string) => <code style={{ fontSize: 12 }}>{ip || '—'}</code>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="#52c41a" />
            {tx('سجل الرقابة السريرية (غير قابل للتعديل)', 'Regulatory Clinical Audit Trail (Immutable)')}
          </Title>
          <Text type="secondary">
            {tx('يوثق: مَن فعل ماذا، متى، في أي سجل، ومن أي عنوان IP', 'Answers: WHO did WHAT, WHEN, to WHICH RECORD, and FROM WHICH IP ADDRESS.')}
          </Text>
          <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
            {loading ? tx('جارٍ التحميل…', 'Loading…') : tx(`${visible.length} حدث مسجل`, `${visible.length} recorded events`)}
          </div>
        </div>
        <Space>
          <Input
            placeholder={tx('بحث في السجل…', 'Search the trail…')}
            prefix={<Search size={14} color="#64748B" />}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            allowClear
            style={{ width: 230, borderRadius: 8 }}
          />
          <Button icon={<RefreshCw size={15} />} onClick={refetch} loading={loading} style={{ borderRadius: 8 }}>
            {tx('تحديث', 'Refresh')}
          </Button>
        </Space>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 13 }}>
          {tx('تعذر تحميل السجل:', 'Could not load the trail:')} {error}
        </div>
      )}

      <Table
        dataSource={visible}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showTotal: (total) => tx(`${total} حدث`, `${total} events`) }}
        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}
        expandable={{
          expandedRowRender: (record) => (
            <Card size="small" title={tx('التفاصيل التقنية والتغييرات', 'Payload Diffs & Technical Metadata')}>
              {record.changes ? (
                <div>
                  <Text strong>{tx('التغييرات:', 'Attribute Changes:')}</Text>
                  <pre style={{ margin: '8px 0', fontSize: 12, direction: 'ltr', textAlign: 'left' }}>
                    {JSON.stringify(record.changes, null, 2)}
                  </pre>
                </div>
              ) : (
                <Text type="secondary">
                  {tx('إنشاء سجل جديد أو حالة ابتدائية.', 'New record created or initial state transaction.')}
                </Text>
              )}
              <div style={{ marginTop: 8 }}>
                <Text strong>{tx('المتصفح: ', 'User Agent: ')}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.userAgent || tx('غير متوفر', 'not recorded')}
                </Text>
              </div>
            </Card>
          ),
        }}
      />
    </div>
  );
}
