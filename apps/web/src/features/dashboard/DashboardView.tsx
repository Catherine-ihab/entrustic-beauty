import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Typography, Space, Button, Progress, Tag, Divider } from 'antd';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  UserPlus,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  Activity,
  Zap,
  Syringe,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { PageHeader, MetricCard, StatusBadge } from '../../design-system';
import { useAuthStore } from '../../store/auth-store';
import { useLang } from '../../lib/useLang';
import { getQueue, subscribeToQueue, QueueEntry } from '../../lib/clinicQueue';

const { Text } = Typography;

interface DashboardViewProps {
  onNavigate: (tabKey: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, clinic } = useAuthStore();
  const { tx } = useLang();

  const userPermissions = user?.permissions || [
    'patients:read',
    'patients:create',
    'appointments:read',
    'appointments:create',
    'records:read',
    'records:create',
    'invoices:read',
  ];

  const hasFinancialAccess = userPermissions.includes('invoices:read');

  // Shared clinic queue integration
  const [liveQueue, setLiveQueue] = useState<QueueEntry[]>([]);

  useEffect(() => {
    const refresh = () => setLiveQueue(getQueue());
    refresh();
    const unsub = subscribeToQueue(refresh);
    return () => unsub();
  }, []);

  const completedTodayCount = liveQueue.filter((q) => q.status === 'done').length;
  const inProgressTodayCount = liveQueue.filter((q) => q.status === 'in-progress').length;
  const waitingTodayCount = liveQueue.filter((q) => q.status === 'waiting' || q.status === 'calling').length;

  const todayQueue = liveQueue.map((item) => ({
    id: item.id,
    patientNumber: item.patientNumber,
    patientName: item.patientName,
    time: item.scheduledTime,
    provider: item.practitioner || (item.serviceCategory === 'laser' ? tx('د. سارة القاضي', 'Dr. Sarah El-Kady') : tx('د. طارق منصور', 'Dr. Tariq Mansour')),
    service: item.serviceName,
    serviceCategory: item.serviceCategory,
    status: item.status === 'in-progress' ? 'in_progress' : item.status === 'done' ? 'completed' : 'confirmed',
    packageInfo: item.packageSessionNumber ? `${item.packageSessionNumber}/${item.packageTotalSessions || 4}` : undefined,
  }));

  return (
    <div>
      <PageHeader
        title={`${tx('أهلاً بك مجدداً، ', 'Welcome back, ')}${user?.firstName ? `د. ${user.firstName}` : tx('دكتورة / دكتور', 'Doctor')}`}
        subtitle={`${tx('نظرة تشغيلية عامة ومباشرة لـ', 'Live operational overview for')} ${clinic?.name || tx('مركز الجلدية والطب التجميلي', 'Entrustic Beauty')}`}
        extra={
          <Space size={10}>
            <Button
              type="primary"
              icon={<PlusCircle size={15} />}
              onClick={() => onNavigate('appointments')}
              style={{ height: 38, borderRadius: 8, fontWeight: 600, backgroundColor: '#be185d', borderColor: '#be185d' }}
            >
              {tx('+ حجز موعد جديد', 'Book Appointment')}
            </Button>
            <Button
              icon={<UserPlus size={15} />}
              onClick={() => onNavigate('patients')}
              style={{ height: 38, borderRadius: 8, fontWeight: 600 }}
            >
              {tx('+ تسجيل حالة جديدة', 'New Patient')}
            </Button>
          </Space>
        }
      />

      {/* Primary KPI Metrics Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={hasFinancialAccess ? 6 : 8}>
          <MetricCard
            title={tx('إجمالي الحالات والعملاء', 'Total Registered Patients')}
            value="1,428"
            icon={<Users size={20} />}
            iconBgColor="#FDF2F8"
            iconColor="#be185d"
            trendText={tx('+14% هذا الشهر', '+14% this month')}
            subtext={tx('سجل نشط', 'active directory')}
          />
        </Col>

        <Col xs={24} sm={12} lg={hasFinancialAccess ? 6 : 8}>
          <MetricCard
            title={tx('مواعيد وجلسات اليوم', "Today's Appointments")}
            value={String(liveQueue.length)}
            icon={<Calendar size={20} />}
            iconBgColor="#F0FDF4"
            iconColor="#16A34A"
            trendText={tx(`${completedTodayCount} مكتملة`, `${completedTodayCount} Completed`)}
            subtext={tx(`${waitingTodayCount} متبقية`, `${waitingTodayCount} remaining`)}
          />
        </Col>

        <Col xs={24} sm={12} lg={hasFinancialAccess ? 6 : 8}>
          <MetricCard
            title={tx('الجلسات الجارية وغرفة الانتظار', 'Active Consultations')}
            value={tx(`${inProgressTodayCount} قيد الجلسة`, `${inProgressTodayCount} In Progress`)}
            icon={<Activity size={20} />}
            iconBgColor="#FFFBEB"
            iconColor="#D97706"
            trendText={tx(`${waitingTodayCount} في الانتظار`, `${waitingTodayCount} in waiting room`)}
            subtext={tx('معدل انتظار طبيعي', 'normal queue pace')}
          />
        </Col>

        {hasFinancialAccess && (
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title={tx('إيرادات ومتحصلات اليوم', "Today's Settled Revenue")}
              value={`12,450 ${clinic?.currency || 'EGP'}`}
              icon={<TrendingUp size={20} />}
              iconBgColor="#F5F3FF"
              iconColor="#7C3AED"
              trendText={tx('92% تم تحصيلها', '92% collected')}
              subtext={tx('850 معلقة', '850 pending')}
            />
          </Col>
        )}
      </Row>

      <Row gutter={[20, 20]}>
        {/* Main Operational Queue */}
        <Col xs={24} lg={16}>
          <Card
            className="elevation-card"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="#be185d" />
                <span>{tx('جدول وقائمة حالات وجلسات اليوم', "Today's Consultation Schedule & Queue")}</span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => onNavigate('appointments')}>
                {tx('عرض جدول المواعيد كاملاً', 'Full Calendar')} <ArrowUpRight size={14} />
              </Button>
            }
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={todayQueue}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: tx('وقت الحجز', 'Slot Time'),
                  dataIndex: 'time',
                  width: 110,
                  render: (t: string) => <Text strong style={{ color: '#0F172A' }}>{t}</Text>,
                },
                {
                  title: tx('الحالة / العميلة', 'Patient'),
                  dataIndex: 'patientName',
                  render: (name: string, record: any) => (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{record.patientNumber}</div>
                    </div>
                  ),
                },
                {
                  title: tx('الخدمة المطلوبة', 'Service Requested'),
                  dataIndex: 'service',
                  render: (srv: string) => <Tag color="magenta">{srv}</Tag>,
                },
                {
                  title: tx('الطبيبة / الأخصائية', 'Attending Practitioner'),
                  dataIndex: 'provider',
                  render: (p: string) => <span style={{ fontSize: 13, color: '#475569' }}>{p}</span>,
                },
                {
                  title: tx('الحالة', 'Status'),
                  dataIndex: 'status',
                  render: (s: string) => <StatusBadge status={s} size="sm" />,
                },
                {
                  title: tx('إجراء', 'Action'),
                  key: 'action',
                  render: (_: any, r: any) => (
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      style={{ borderRadius: 6, borderColor: '#be185d', color: '#be185d', fontWeight: 600 }}
                      onClick={() => onNavigate(r.serviceCategory || 'appointments')}
                    >
                      {tx('فتح الغرفة', 'Open Room')}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right Sidebar Widgets */}
        <Col xs={24} lg={8}>
          {/* Quick Specialty Actions */}
          <Card
            className="elevation-card"
            title={tx('اختصارات سريعة للخدمات', 'Frequent Actions')}
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                block
                style={{ textAlign: 'start', height: 44, display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => onNavigate('laser')}
              >
                <Zap size={18} color="#be185d" />
                <span>{tx('جلسات إزالة الشعر بالليزر', 'Laser Hair Removal Workspace')}</span>
              </Button>
              <Button
                block
                style={{ textAlign: 'start', height: 44, display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => onNavigate('injectables')}
              >
                <Syringe size={18} color="#7C3AED" />
                <span>{tx('حقن البوتوكس والفيلر', 'Botox & Injectables Registry')}</span>
              </Button>
              <Button
                block
                style={{ textAlign: 'start', height: 44, display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => onNavigate('skincare')}
              >
                <Sparkles size={18} color="#0d9488" />
                <span>{tx('العناية بالبشرة والسبا والمساج', 'Skin Care & Spa')}</span>
              </Button>
              <Button
                block
                style={{ textAlign: 'start', height: 44, display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => onNavigate('packages')}
              >
                <Ticket size={18} color="#4f46e5" />
                <span>{tx('باقات وعروض الجلسات', 'Client Packages & Credits')}</span>
              </Button>
              {hasFinancialAccess && (
                <Button
                  block
                  style={{ textAlign: 'start', height: 44, display: 'flex', alignItems: 'center', gap: 12 }}
                  onClick={() => onNavigate('invoices')}
                >
                  <Receipt size={18} color="#D97706" />
                  <span>{tx('الفواتير والمالية والخزينة', 'Issue Invoice / Cashier')}</span>
                </Button>
              )}
            </div>
          </Card>

          {/* Laser Devices & Consumables Live Status */}
          <Card
            className="elevation-card"
            title={tx('حالة الأجهزة والمستهلكات', 'Workstations & Consumables Status')}
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>Candela GentleMax Pro Plus</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>755nm / 1064nm Dual Handpiece</Text>
                </div>
                <Tag color="success">{tx('جاهز / 42 ألف ضربة', 'Ready / 42k shots')}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>InMode Morpheus8 RF</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>Face 24-Pin Tip Mounted</Text>
                </div>
                <Tag color="success">{tx('تمت المعايرة', 'Calibrated')}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>HydraFacial Syndeo</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>Vortex-Fusion System</Text>
                </div>
                <Tag color="processing">{tx('قيد الجلسة', 'In Treatment')}</Tag>
              </div>
              <Divider style={{ margin: '6px 0' }} />
              <div style={{ background: '#FFF1F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #FFE4E6' }}>
                <Text strong style={{ fontSize: 12, color: '#BE123C' }}>{tx('تنبيه نقص مستلزمات:', 'Low Consumables Alert:')}</Text>
                <div style={{ fontSize: 11, color: '#9F1239', marginTop: 2 }}>
                  {tx('غاز تبريد كانديلا DCD: متبقي أسطوانتين • بوتوكس 100 وحدة: متبقي 4 فيالات في الثلاجة.', 'Candela DCD Cryogen: 2 canisters left • Botox 100U: 4 vials in cold storage.')}
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Clinic Capacity */}
          <Card
            className="elevation-card"
            title={tx('الطاقة الاستيعابية اليومية للعيادة', 'Daily Appointment Capacity')}
            style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#64748B' }}>{tx('المواعيد المحجوزة', 'Slots Utilized')}</Text>
              <Text strong style={{ color: '#0F172A' }}>{tx('18 من 24 موعد (75%)', '18 of 24 (75%)')}</Text>
            </div>
            <Progress percent={75} strokeColor="#be185d" showInfo={false} style={{ marginBottom: 16 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <Text style={{ color: '#64748B', fontSize: 13 }}>{tx('متوسط مدة الانتظار', 'Average Wait Time')}</Text>
              <Text strong style={{ color: '#059669', fontSize: 13 }}>{tx('12 دقيقة', '12 minutes')}</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
