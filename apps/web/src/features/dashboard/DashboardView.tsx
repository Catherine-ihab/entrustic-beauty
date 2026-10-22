import React from 'react';
import { Row, Col, Card, Table, Typography, Space, Button, Progress, Tag, Divider, Empty, Spin } from 'antd';
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
import { useDashboardSummary } from './useDashboardSummary';

const { Text } = Typography;

interface DashboardViewProps {
  onNavigate: (tabKey: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, clinic } = useAuthStore();
  const { tx } = useLang();
  const { data, loading, error, refetch } = useDashboardSummary();

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

  const patients = data?.patients;
  const appts = data?.appointments;
  const revenue = data?.revenue;
  const capacity = data?.capacity;
  const currency = revenue?.currency || clinic?.currency || 'EGP';

  const todayQueue = (data?.todaySchedule || []).map((row) => ({
    id: row.id,
    patientNumber: row.patientNumber,
    patientName: row.patientName,
    time: row.startTime,
    provider: row.provider,
    service: row.service || '—',
    serviceCategory: 'appointments',
    status: row.status,
  }));

  const collectionRate =
    revenue && revenue.todayBilled > 0
      ? Math.round((revenue.todayCollected / revenue.todayBilled) * 100)
      : 0;


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
            value={patients ? fmt(patients.total) : '—'}
            icon={<Users size={20} />}
            iconBgColor="#FDF2F8"
            iconColor="#be185d"
            trendText={tx(
              `+${fmt(patients?.newThisMonth ?? 0)} هذا الشهر`,
              `+${fmt(patients?.newThisMonth ?? 0)} this month`,
            )}
            subtext={tx(`${fmt(patients?.active ?? 0)} سجل نشط`, `${fmt(patients?.active ?? 0)} active`)}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={hasFinancialAccess ? 6 : 8}>
          <MetricCard
            title={tx('مواعيد وجلسات اليوم', "Today's Appointments")}
            value={appts ? fmt(appts.today) : '—'}
            icon={<Calendar size={20} />}
            iconBgColor="#F0FDF4"
            iconColor="#16A34A"
            trendText={tx(
              `${fmt(appts?.todayCompleted ?? 0)} مكتملة`,
              `${fmt(appts?.todayCompleted ?? 0)} Completed`,
            )}
            subtext={tx(
              `${fmt(appts?.todayRemaining ?? 0)} متبقية`,
              `${fmt(appts?.todayRemaining ?? 0)} remaining`,
            )}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={hasFinancialAccess ? 6 : 8}>
          <MetricCard
            title={tx('الجلسات الجارية وغرفة الانتظار', 'Active Consultations')}
            value={tx(
              `${fmt(appts?.inProgress ?? 0)} قيد الجلسة`,
              `${fmt(appts?.inProgress ?? 0)} In Progress`,
            )}
            icon={<Activity size={20} />}
            iconBgColor="#FFFBEB"
            iconColor="#D97706"
            trendText={tx(
              `${fmt(appts?.waiting ?? 0)} في الانتظار`,
              `${fmt(appts?.waiting ?? 0)} in waiting room`,
            )}
            subtext={tx('معدل انتظار طبيعي', 'normal queue pace')}
            loading={loading}
          />
        </Col>

        {hasFinancialAccess && (
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title={tx('إيرادات ومتحصلات اليوم', "Today's Settled Revenue")}
              value={revenue ? `${fmt(revenue.todayCollected)} ${currency}` : '—'}
              icon={<TrendingUp size={20} />}
              iconBgColor="#F5F3FF"
              iconColor="#7C3AED"
              trendText={tx(`${collectionRate}% تم تحصيلها`, `${collectionRate}% collected`)}
              subtext={tx(
                `${fmt(revenue?.todayPending ?? 0)} معلقة`,
                `${fmt(revenue?.todayPending ?? 0)} pending`,
              )}
              loading={loading}
            />
          </Col>
        )}
      </Row>

      {error && (
        <Card
          style={{ borderRadius: 12, border: '1px solid #FECACA', background: '#FEF2F2', marginBottom: 20 }}
          bodyStyle={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ color: '#B91C1C' }}>
            {tx('تعذر تحميل بيانات لوحة التحكم.', 'Could not load dashboard data.')} {error}
          </Text>
          <Button size="small" onClick={refetch}>
            {tx('إعادة المحاولة', 'Retry')}
          </Button>
        </Card>
      )}

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
              loading={loading}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={tx('لا توجد مواعيد اليوم', 'No appointments today')}
                  />
                ),
              }}
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
                  render: () => (
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      style={{ borderRadius: 6, borderColor: '#be185d', color: '#be185d', fontWeight: 600 }}
                      onClick={() => onNavigate('appointments')}
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
              {loading && <Spin size="small" />}
              {!loading && (data?.devices?.length ?? 0) === 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {tx('لا توجد أجهزة مسجلة', 'No devices registered')}
                </Text>
              )}
              {(data?.devices || []).map((d) => (
                <div
                  key={d.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>{d.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {d.model || '—'}
                      {d.nextCalibration ? ` · ${d.nextCalibration}` : ''}
                    </Text>
                  </div>
                  <Tag color={d.status === 'active' ? 'success' : d.status === 'maintenance' ? 'warning' : 'default'}>
                    {d.status === 'active'
                      ? tx('جاهز', 'Ready')
                      : d.status === 'maintenance'
                        ? tx('صيانة', 'Maintenance')
                        : d.status}
                  </Tag>
                </div>
              ))}
              <Divider style={{ margin: '6px 0' }} />
              {(data?.lowStock?.length ?? 0) > 0 ? (
                <div style={{ background: '#FFF1F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #FFE4E6' }}>
                  <Text strong style={{ fontSize: 12, color: '#BE123C' }}>
                    {tx('تنبيه نقص مستلزمات:', 'Low Consumables Alert:')}
                  </Text>
                  <div style={{ fontSize: 11, color: '#9F1239', marginTop: 2 }}>
                    {(data?.lowStock || [])
                      .map((s) => `${s.name}: ${tx('متبقي', 'left')} ${s.remaining} ${s.unit || ''}`.trim())
                      .join(' • ')}
                  </div>
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {tx('المخزون في المستوى الطبيعي', 'Stock levels are healthy')}
                </Text>
              )}
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
              <Text strong style={{ color: '#0F172A' }}>
                {capacity
                  ? tx(
                      `${capacity.bookedToday} من ${capacity.dailySlots} موعد (${capacity.utilizationPercent}%)`,
                      `${capacity.bookedToday} of ${capacity.dailySlots} (${capacity.utilizationPercent}%)`,
                    )
                  : '—'}
              </Text>
            </div>
            <Progress
              percent={capacity?.utilizationPercent ?? 0}
              strokeColor="#be185d"
              showInfo={false}
              style={{ marginBottom: 16 }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <Text style={{ color: '#64748B', fontSize: 13 }}>
                {tx('مواعيد قادمة (٧ أيام)', 'Upcoming (7 days)')}
              </Text>
              <Text strong style={{ color: '#059669', fontSize: 13 }}>
                {appts ? tx(`${fmt(appts.upcoming)} موعد`, `${fmt(appts.upcoming)} booked`) : '—'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
