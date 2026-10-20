import { useState } from 'react';
import { Table, Tag, Typography, Card } from 'antd';
import { IAuditLogEntry } from '@clinic/shared-types';
import { ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';
import { useLang } from '../../lib/useLang';

const { Title, Text } = Typography;

export function AuditLogsView() {
  const { tx } = useLang();

  const [logs] = useState<IAuditLogEntry[]>([
    {
      id: 'log-1',
      clinicId: 'beauty-clinic',
      userId: 'u-1',
      userEmail: 'dr.tariq@beauty-clinic.com',
      action: 'UPDATE',
      entityType: 'visit',
      entityId: 'v-1',
      changes: {
        notes: {
          old: 'Botox 20U glabella',
          new: 'Botox 20U glabella + Frontalis 10U — touch-up requested',
        },
      },
      ipAddress: '192.168.1.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: dayjs().subtract(10, 'minute').toISOString(),
    },
    {
      id: 'log-2',
      clinicId: 'beauty-clinic',
      userId: 'u-2',
      userEmail: 'reception@beauty-clinic.com',
      action: 'CREATE',
      entityType: 'invoice',
      entityId: 'inv-1',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: dayjs().subtract(1, 'hour').toISOString(),
    },
    {
      id: 'log-3',
      clinicId: 'beauty-clinic',
      userId: 'u-2',
      userEmail: 'reception@beauty-clinic.com',
      action: 'CREATE',
      entityType: 'patient',
      entityId: 'p-1',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: dayjs().subtract(2, 'hour').toISOString(),
    },
  ]);

  const actionColorMap: Record<string, string> = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN: 'purple',
  };

  const columns = [
    {
      title: tx('التوقيت (UTC)', 'Timestamp (UTC)'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: tx('المستخدم / المنفذ', 'User / Actor'),
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email: string) => <code>{email}</code>,
    },
    {
      title: tx('الإجراء', 'Action'),
      dataIndex: 'action',
      key: 'action',
      render: (act: string) => <Tag color={actionColorMap[act] || 'default'}>{act}</Tag>,
    },
    {
      title: tx('السجل المتأثر', 'Resource'),
      key: 'resource',
      render: (_: any, r: IAuditLogEntry) => (
        <span>
          <Tag color="cyan">{r.entityType.toUpperCase()}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.entityId}</Text>
        </span>
      ),
    },
    {
      title: tx('عنوان IP', 'IP Address'),
      dataIndex: 'ipAddress',
      key: 'ip',
      render: (ip: string) => <code>{ip}</code>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} color="#52c41a" />
          {tx('سجل الرقابة السريرية (غير قابل للتعديل)', 'Regulatory Clinical Audit Trail (Immutable)')}
        </Title>
        <Text type="secondary">
          {tx('يوثق: مَن فعل ماذا، متى، في أي سجل، ومن أي عنوان IP', 'Answers: WHO did WHAT, WHEN, to WHICH RECORD, and FROM WHICH IP ADDRESS.')}
        </Text>
      </div>

      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        expandable={{
          expandedRowRender: (record) => (
            <Card size="small" title={tx('التفاصيل التقنية والتغييرات', 'Payload Diffs & Technical Metadata')}>
              {record.changes ? (
                <div>
                  <Text strong>{tx('التغييرات:', 'Attribute Changes:')}</Text>
                  <pre style={{ margin: '8px 0', fontSize: 12 }}>
                    {JSON.stringify(record.changes, null, 2)}
                  </pre>
                </div>
              ) : (
                <Text type="secondary">{tx('إنشاء سجل جديد أو حالة ابتدائية.', 'New record created or initial state transaction.')}</Text>
              )}
              <div style={{ marginTop: 8 }}>
                <Text strong>{tx('المتصفح: ', 'User Agent: ')}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{record.userAgent}</Text>
              </div>
            </Card>
          ),
        }}
      />
    </div>
  );
}
