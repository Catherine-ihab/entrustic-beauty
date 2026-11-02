import { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Row, Col, Modal, Form,
  InputNumber, Select, Input, message, Segmented, Radio,
} from 'antd';
import {
  CheckCircle2, Clock, UserCheck, Wallet,
  TrendingUp, Plus, FileText, Printer, Award,
  DollarSign, ShoppingBag, ShieldCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  getDoctorEarnings,
  getDoctorPayouts,
  getDoctorCommissionRules,
  payoutDoctorSettlement,
  addManualDoctorEarning,
  DoctorEarningEntry,
  DoctorPayout,
  DoctorCommissionRule,
  saveDoctorCommissionRules,
} from '../../lib/doctorEarnings';

const { Text, Title } = Typography;

export function DoctorSettlementsView() {
  const [earnings, setEarnings] = useState<DoctorEarningEntry[]>(getDoctorEarnings);
  const [payouts, setPayouts] = useState<DoctorPayout[]>(getDoctorPayouts);
  const [rules, setRules] = useState<DoctorCommissionRule[]>(getDoctorCommissionRules);
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'ledger' | 'payouts'>('summary');

  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accrued' | 'settled'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isVoucherPrintOpen, setIsVoucherPrintOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<DoctorPayout | null>(null);

  const [payoutDoctorName, setPayoutDoctorName] = useState<string>('');
  const [payoutForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [manualForm] = Form.useForm();

  const refreshData = () => {
    setEarnings(getDoctorEarnings());
    setPayouts(getDoctorPayouts());
    setRules(getDoctorCommissionRules());
  };

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('doctor_earnings_updated', handleUpdate);
    return () => window.removeEventListener('doctor_earnings_updated', handleUpdate);
  }, []);

  // Unique list of doctors/staff from rules and earnings
  const allDoctors = useMemo(() => {
    const names = new Set<string>();
    rules.forEach((r) => names.add(r.doctorName));
    earnings.forEach((e) => names.add(e.doctorName));
    return Array.from(names);
  }, [rules, earnings]);

  // Aggregate doctor/staff stats
  const doctorSummaries = useMemo(() => {
    return allDoctors.map((docName) => {
      const docEarnings = earnings.filter((e) => e.doctorName === docName);
      const totalEarned = docEarnings.reduce((s, e) => s + e.earnedAmountEgp, 0);
      const settledAmount = docEarnings.filter((e) => e.status === 'settled').reduce((s, e) => s + e.earnedAmountEgp, 0);
      const pendingBalance = totalEarned - settledAmount;
      const totalSessions = docEarnings.filter((e) => e.itemType !== 'product_sale').length;
      const totalProductSales = docEarnings.filter((e) => e.itemType === 'product_sale').length;
      const totalRevenueGenerated = docEarnings.reduce((s, e) => s + e.servicePriceEgp, 0);

      const rule = rules.find((r) => r.doctorName === docName);
      const roleType = rule?.roleType || docEarnings[0]?.roleType || 'doctor';
      const rateLabel = rule
        ? rule.rateType === 'fixed_per_session'
          ? `${rule.fixedRateEgp} ج.م / جلسة`
          : `${rule.percentageRate}%`
        : '20%';

      const productRateLabel = rule?.productCommissionRate ? `${rule.productCommissionRate}% منتجات` : '—';

      return {
        doctorName: docName,
        doctorId: rule?.doctorId || 'doc-custom',
        specialty: rule?.specialty || 'تخصص عام',
        roleType,
        rateLabel,
        productRateLabel,
        totalSessions,
        totalProductSales,
        totalRevenueGenerated,
        totalEarned,
        settledAmount,
        pendingBalance,
      };
    });
  }, [allDoctors, earnings, rules]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return doctorSummaries.filter((d) => {
      const matchRole = roleFilter === 'all' || d.roleType === roleFilter;
      const matchDoc = selectedDoctor === 'all' || d.doctorName === selectedDoctor;
      return matchRole && matchDoc;
    });
  }, [doctorSummaries, roleFilter, selectedDoctor]);

  // Filtered earnings
  const filteredEarnings = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const weekAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    return earnings.filter((e) => {
      const matchDoc = selectedDoctor === 'all' || e.doctorName === selectedDoctor;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchRole = roleFilter === 'all' || e.roleType === roleFilter;

      let matchDate = true;
      if (dateRangeFilter === 'today') matchDate = e.date === today;
      else if (dateRangeFilter === 'week') matchDate = e.date >= weekAgo;
      else if (dateRangeFilter === 'month') matchDate = e.date >= monthAgo;

      return matchDoc && matchStatus && matchRole && matchDate;
    });
  }, [earnings, selectedDoctor, statusFilter, roleFilter, dateRangeFilter]);

  const totalAccruedPending = useMemo(() => {
    return earnings.filter((e) => e.status === 'accrued').reduce((s, e) => s + e.earnedAmountEgp, 0);
  }, [earnings]);

  const totalSettledPaid = useMemo(() => {
    return earnings.filter((e) => e.status === 'settled').reduce((s, e) => s + e.earnedAmountEgp, 0);
  }, [earnings]);

  const totalProductCommissions = useMemo(() => {
    return earnings.filter((e) => e.itemType === 'product_sale').reduce((s, e) => s + e.earnedAmountEgp, 0);
  }, [earnings]);

  const handleOpenPayout = (docName: string, maxAmount: number) => {
    setPayoutDoctorName(docName);
    const docSummary = doctorSummaries.find((d) => d.doctorName === docName);
    payoutForm.setFieldsValue({
      amountEgp: maxAmount > 0 ? maxAmount : 0,
      paymentMethod: 'cash',
      doctorName: docName,
      doctorId: docSummary?.doctorId || 'doc-1',
      notes: `تسوية مستحقات حتى تاريخ ${dayjs().format('YYYY/MM/DD')}`,
    });
    setIsPayoutModalOpen(true);
  };

  const handleSavePayout = (values: any) => {
    const newPayout = payoutDoctorSettlement({
      doctorId: values.doctorId || 'doc-1',
      doctorName: values.doctorName || payoutDoctorName,
      amountEgp: Number(values.amountEgp),
      paymentMethod: values.paymentMethod || 'cash',
      referenceNo: values.referenceNo,
      notes: values.notes,
    });
    message.success(`✅ تم صرف مستحقات بقيمة ${Number(values.amountEgp).toLocaleString()} ج.م للطبيب/ة [${values.doctorName || payoutDoctorName}] برقم سند: ${newPayout.voucherNumber}`);
    setIsPayoutModalOpen(false);
    payoutForm.resetFields();
    refreshData();
    // Prompt to print voucher
    setSelectedVoucher(newPayout);
    setIsVoucherPrintOpen(true);
  };

  const handleSaveRule = (values: any) => {
    const existingIndex = rules.findIndex((r) => r.doctorName === values.doctorName);
    let next: DoctorCommissionRule[];
    const newRule: DoctorCommissionRule = {
      doctorId: values.doctorId || `doc-${Date.now()}`,
      doctorName: values.doctorName,
      specialty: values.specialty || 'تجميل وجلدية',
      roleType: values.roleType || 'doctor',
      rateType: values.rateType || 'percentage',
      percentageRate: values.percentageRate || 20,
      fixedRateEgp: values.fixedRateEgp || 150,
      productCommissionRate: values.productCommissionRate || 10,
    };

    if (existingIndex >= 0) {
      next = [...rules];
      next[existingIndex] = newRule;
    } else {
      next = [newRule, ...rules];
    }
    saveDoctorCommissionRules(next);
    setRules(next);
    message.success('✅ تم حفظ قواعد احتساب الأجر والعمولة بنجاح');
    setIsRulesModalOpen(false);
    ruleForm.resetFields();
  };

  const handleSaveManualEarning = (values: any) => {
    addManualDoctorEarning({
      doctorName: values.doctorName,
      roleType: values.roleType || 'specialist',
      itemType: values.itemType || 'product_sale',
      patientName: values.patientName,
      serviceOrProductName: values.serviceOrProductName,
      baseAmountEgp: Number(values.baseAmountEgp || 0),
      commissionAmountEgp: Number(values.commissionAmountEgp || 0),
      notes: values.notes,
    });
    message.success('✅ تم قيد استحقاق العمولة بالحساب بنجاح');
    setIsManualModalOpen(false);
    manualForm.resetFields();
    refreshData();
  };

  const renderRoleBadge = (role?: string) => {
    switch (role) {
      case 'doctor':
        return <Tag color="magenta" style={{ fontWeight: 700 }}>طبيب/ة معالج</Tag>;
      case 'specialist':
        return <Tag color="blue" style={{ fontWeight: 700 }}>أخصائي/ة تجميل</Tag>;
      case 'nurse_tech':
        return <Tag color="cyan" style={{ fontWeight: 700 }}>تمريض / فني ليزر</Tag>;
      default:
        return <Tag color="default">كادر طبي</Tag>;
    }
  };

  const doctorColumns = [
    {
      title: 'الطبيب/ة أو الأخصائي/ة',
      key: 'doc',
      render: (_: any, r: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{r.doctorName}</Text>
            {renderRoleBadge(r.roleType)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.specialty}</div>
        </div>
      ),
    },
    {
      title: 'نظام الجلسات',
      dataIndex: 'rateLabel',
      key: 'rate',
      render: (v: string) => <Tag color="purple" style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: 'نسبة بيع المنتجات',
      dataIndex: 'productRateLabel',
      key: 'pRate',
      render: (v: string) => <Tag color="gold" style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: 'الجلسات والمنتجات',
      key: 'activity',
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>⚡ {r.totalSessions} جلسة علاجية</Text>
          {r.totalProductSales > 0 && (
            <Text style={{ fontSize: 12, color: '#b45309' }}>🛍️ {r.totalProductSales} منتج مباع</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'إيراد الخدمات المحققة',
      dataIndex: 'totalRevenueGenerated',
      key: 'rev',
      render: (v: number) => <Text style={{ fontWeight: 600 }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'إجمالي المستحق المكتسب',
      dataIndex: 'totalEarned',
      key: 'earned',
      render: (v: number) => <Text style={{ color: '#047857', fontWeight: 800 }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'المدفوع',
      dataIndex: 'settledAmount',
      key: 'settled',
      render: (v: number) => <Text style={{ color: '#0369A1' }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'الرصيد المتبقي للصرف',
      dataIndex: 'pendingBalance',
      key: 'balance',
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#B91C1C' : '#047857', fontWeight: 800, fontSize: 15 }}>
          {v.toLocaleString()} ج.م
        </Text>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      render: (_: any, r: any) => (
        <Button
          size="small"
          type="primary"
          icon={<Wallet size={13} />}
          disabled={r.pendingBalance <= 0}
          onClick={() => handleOpenPayout(r.doctorName, r.pendingBalance)}
          style={{ background: r.pendingBalance > 0 ? '#047857' : undefined, borderColor: '#047857' }}
        >
          صرف المستحقات
        </Button>
      ),
    },
  ];

  const earningColumns = [
    {
      title: 'تاريخ وساعة الإجراء',
      key: 'time',
      width: 140,
      render: (_: any, r: DoctorEarningEntry) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.date}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.time}</Text>
        </div>
      ),
    },
    {
      title: 'الكادر الطبي',
      key: 'doc',
      render: (_: any, r: DoctorEarningEntry) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.doctorName}</div>
          {renderRoleBadge(r.roleType)}
        </div>
      ),
    },
    {
      title: 'الحالة / المريض',
      dataIndex: 'patientName',
      key: 'patient',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'الخدمة أو المنتج المباع',
      key: 'service',
      render: (_: any, r: DoctorEarningEntry) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.itemType === 'product_sale' && <ShoppingBag size={13} color="#b45309" />}
            {r.itemType === 'bonus' && <Award size={13} color="#6d28d9" />}
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.serviceName}</span>
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.notes || r.serviceCategory}</Text>
        </div>
      ),
    },
    {
      title: 'سعر الخدمة/المنتج',
      dataIndex: 'servicePriceEgp',
      key: 'price',
      render: (v: number) => <Text>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'النسبة / الأجر',
      key: 'rate',
      render: (_: any, r: DoctorEarningEntry) => (
        <Tag color={r.itemType === 'product_sale' ? 'gold' : 'geekblue'}>
          {r.rateType === 'fixed_per_session' ? `${r.commissionRate} ج.م` : `${r.commissionRate}%`}
        </Tag>
      ),
    },
    {
      title: 'المستحق المكتسب',
      dataIndex: 'earnedAmountEgp',
      key: 'earned',
      render: (v: number) => (
        <Text style={{ color: '#047857', fontWeight: 800 }}>{v.toLocaleString()} ج.م</Text>
      ),
    },
    {
      title: 'حالة الصرف',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'settled' ? 'green' : 'orange'} style={{ fontWeight: 600 }}>
          {s === 'settled' ? 'تم الصرف ✅' : 'مستحق معلق ⏳'}
        </Tag>
      ),
    },
  ];

  const payoutColumns = [
    {
      title: 'رقم السند والتاريخ',
      key: 'vouch',
      render: (_: any, r: DoctorPayout) => (
        <div>
          <div style={{ fontWeight: 700, color: '#047857' }}>{r.voucherNumber}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(r.date).format('YYYY/MM/DD HH:mm')}</Text>
        </div>
      ),
    },
    {
      title: 'الطبيب/ة المستلم/ة',
      dataIndex: 'doctorName',
      key: 'doc',
      render: (v: string) => <Text strong style={{ fontSize: 14 }}>{v}</Text>,
    },
    {
      title: 'المبلغ المنصرف',
      dataIndex: 'amountEgp',
      key: 'amt',
      render: (v: number) => (
        <Text style={{ color: '#047857', fontWeight: 800, fontSize: 15 }}>
          {v.toLocaleString()} ج.م
        </Text>
      ),
    },
    {
      title: 'طريقة الصرف',
      dataIndex: 'paymentMethod',
      key: 'method',
      render: (m: string) => {
        switch (m) {
          case 'cash':
            return <Tag color="green">نقداً من الخزينة</Tag>;
          case 'bank_transfer':
            return <Tag color="blue">تحويل بنكي / إنستاباي</Tag>;
          case 'cheque':
            return <Tag color="purple">شيك مصرفي</Tag>;
          default:
            return <Tag>{m}</Tag>;
        }
      },
    },
    {
      title: 'رقم الإيصال / المرجع',
      dataIndex: 'referenceNo',
      key: 'ref',
      render: (v: string) => <Tag color="default">{v || '—'}</Tag>,
    },
    {
      title: 'البيان والملاحظات',
      dataIndex: 'notes',
      key: 'notes',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || 'تسوية مستحقات'}</Text>,
    },
    {
      title: 'طباعة الإيصال',
      key: 'print',
      render: (_: any, r: DoctorPayout) => (
        <Button
          size="small"
          icon={<Printer size={13} />}
          onClick={() => {
            setSelectedVoucher(r);
            setIsVoucherPrintOpen(true);
          }}
        >
          طباعة السند
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
          borderRadius: 14,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 6px 20px rgba(4, 120, 87, 0.25)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Space align="center" size={14}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  width: 46,
                  height: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  حاسبة ونظام عمولات الأطباء وطاقم التمريض
                </Title>
                <Text style={{ color: '#d1fae5', fontSize: 13 }}>
                  إدارة مالية دقيقة لاحتساب أجور ونسب الجلسات التجميلية، مبيعات مستحضرات العناية، وتسوية السندات النقدية
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'start' }}>
            <Space wrap>
              <Button
                icon={<ShoppingBag size={15} />}
                style={{ borderRadius: 8, fontWeight: 600 }}
                onClick={() => {
                  manualForm.resetFields();
                  setIsManualModalOpen(true);
                }}
              >
                + قيد عمولة منتج / حافز
              </Button>
              <Button
                type="primary"
                icon={<Plus size={15} />}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#064e3b',
                  borderColor: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 8,
                }}
                onClick={() => {
                  ruleForm.resetFields();
                  setIsRulesModalOpen(true);
                }}
              >
                إعداد قواعد ونسب الكادر
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #fed7aa', background: '#fffbeb' }}>
            <Space align="center" size={10}>
              <Clock size={20} color="#ea580c" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>المستحقات المعلقة للصرف</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ea580c' }}>
                  {totalAccruedPending.toLocaleString()} ج.م
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
            <Space align="center" size={10}>
              <CheckCircle2 size={20} color="#047857" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>إجمالي المسدد والمصروف</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#047857' }}>
                  {totalSettledPaid.toLocaleString()} ج.م
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #fef08a', background: '#fefce8' }}>
            <Space align="center" size={10}>
              <ShoppingBag size={20} color="#ca8a04" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>عمولات مبيعات المنتجات</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ca8a04' }}>
                  {totalProductCommissions.toLocaleString()} ج.م
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
            <Space align="center" size={10}>
              <TrendingUp size={20} color="#2563eb" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>إجمالي الحركات المحتسبة</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>
                  {earnings.length} حركة مسجلة
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Sub Tabs */}
      <Card size="small" style={{ borderRadius: 10 }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Segmented
              value={activeSubTab}
              onChange={(val) => setActiveSubTab(val as any)}
              options={[
                { value: 'summary', label: `👥 أرصدة الكادر الطبي (${doctorSummaries.length})` },
                { value: 'ledger', label: `📋 سجل الحركات والعمولات (${earnings.length})` },
                { value: 'payouts', label: `🧾 سندات الصرف والتسويات (${payouts.length})` },
              ]}
            />
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'start' }}>
            <Space wrap>
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: 'جميع الفئات' },
                  { value: 'doctor', label: 'الأطباء فقط' },
                  { value: 'specialist', label: 'الأخصائيات' },
                  { value: 'nurse_tech', label: 'التمريض والفنيين' },
                ]}
              />
              <Select
                value={selectedDoctor}
                onChange={setSelectedDoctor}
                style={{ width: 160 }}
                options={[
                  { value: 'all', label: 'كل الأسماء' },
                  ...allDoctors.map((d) => ({ value: d, label: d })),
                ]}
              />
              {activeSubTab === 'ledger' && (
                <Select
                  value={dateRangeFilter}
                  onChange={setDateRangeFilter}
                  style={{ width: 120 }}
                  options={[
                    { value: 'all', label: 'كل الفترات' },
                    { value: 'today', label: 'اليوم' },
                    { value: 'week', label: 'آخر 7 أيام' },
                    { value: 'month', label: 'آخر 30 يوماً' },
                  ]}
                />
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Views based on activeSubTab */}
      {activeSubTab === 'summary' && (
        <Card
          style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
          title={
            <Space>
              <UserCheck size={18} color="#047857" />
              <Text strong>مستحقات وأرصدة الأطباء والأخصائيات والتمريض</Text>
            </Space>
          }
          extra={<Text type="secondary" style={{ fontSize: 12 }}>يتم احتساب الرصيد آلياً فور تنفيذ الجلسة</Text>}
        >
          <Table
            dataSource={filteredSummaries}
            columns={doctorColumns}
            rowKey="doctorName"
            pagination={false}
            size="middle"
            scroll={{ x: 900 }}
          />
        </Card>
      )}

      {activeSubTab === 'ledger' && (
        <Card
          style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
          title={
            <Space>
              <FileText size={18} color="#2563eb" />
              <Text strong>سجل استحقاقات الجلسات ومبيعات المنتجات</Text>
              <Tag color="blue">{filteredEarnings.length} حركة</Tag>
            </Space>
          }
          extra={
            <Radio.Group
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="all">الكل</Radio.Button>
              <Radio.Button value="accrued">معلق ⏳</Radio.Button>
              <Radio.Button value="settled">تم الصرف ✅</Radio.Button>
            </Radio.Group>
          }
        >
          <Table
            dataSource={filteredEarnings}
            columns={earningColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
            scroll={{ x: 950 }}
          />
        </Card>
      )}

      {activeSubTab === 'payouts' && (
        <Card
          style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
          title={
            <Space>
              <Wallet size={18} color="#047857" />
              <Text strong>سجل إيصالات وسندات الصرف المسددة للأطباء</Text>
              <Tag color="green">{payouts.length} سند صرف</Tag>
            </Space>
          }
        >
          <Table
            dataSource={payouts}
            columns={payoutColumns}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 8 }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}

      {/* Modal: Payout Doctor Settlement */}
      <Modal
        title={
          <Space>
            <Wallet size={18} color="#047857" />
            <span style={{ fontWeight: 700 }}>صرف وتسوية مستحقات: {payoutDoctorName}</span>
          </Space>
        }
        open={isPayoutModalOpen}
        onCancel={() => setIsPayoutModalOpen(false)}
        footer={null}
        width={520}
      >
        <Form form={payoutForm} layout="vertical" onFinish={handleSavePayout}>
          <Form.Item name="doctorId" hidden><Input /></Form.Item>
          <Form.Item name="doctorName" hidden><Input /></Form.Item>

          <Form.Item
            name="amountEgp"
            label="المبلغ المراد صرفه (ج.م)"
            rules={[{ required: true, message: 'مطلوب إدخال المبلغ' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={1}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              addonAfter="ج.م"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="طريقة الصرف" initialValue="cash" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'cash', label: '💵 نقداً من الخزينة' },
                    { value: 'bank_transfer', label: '📱 تحويل بنكي / إنستاباي' },
                    { value: 'cheque', label: '📑 شيك مصرفي' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="referenceNo" label="رقم السند أو التحويل">
                <Input placeholder="مثال: REF-99210 أو إيصال 14" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="ملاحظات الصرف والتسوية">
            <Input.TextArea rows={2} placeholder="مثال: تسوية مستحقات أسبوع العمل الحالي" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsPayoutModalOpen(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#047857', borderColor: '#047857', fontWeight: 700 }}>
              تأكيد الصرف وطباعة السند
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Manual Commission Entry (Product / Bonus) */}
      <Modal
        title={
          <Space>
            <ShoppingBag size={18} color="#b45309" />
            <span style={{ fontWeight: 700 }}>قيد عمولة مبيعات منتجات أو حافز إداري</span>
          </Space>
        }
        open={isManualModalOpen}
        onCancel={() => setIsManualModalOpen(false)}
        footer={null}
        width={550}
      >
        <Form form={manualForm} layout="vertical" onFinish={handleSaveManualEarning}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="doctorName" label="اسم الطبيب/ة أو الأخصائي/ة" rules={[{ required: true }]}>
                <Select
                  placeholder="اختر الطبيب/ة أو الأخصائي/ة"
                  options={allDoctors.map((d) => ({ value: d, label: d }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="itemType" label="نوع الحركة" initialValue="product_sale" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'product_sale', label: '🛍️ مبيعات منتجات عناية' },
                    { value: 'bonus', label: '🏆 مكافأة وحافز إداري' },
                    { value: 'session', label: '⚡ جلسة استثنائية' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="serviceOrProductName" label="اسم المنتج أو سبب الحافز" rules={[{ required: true }]}>
            <Input placeholder="مثال: كريم حماية لاروش بوزيه Anthelios 50+ أو واقي شمس" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="baseAmountEgp" label="إجمالي قيمة المبيعات (ج.م)" initialValue={800}>
                <InputNumber style={{ width: '100%' }} min={0} addonAfter="ج.م" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commissionAmountEgp" label="مبلغ العمولة المستحقة (ج.م)" rules={[{ required: true }]} initialValue={80}>
                <InputNumber style={{ width: '100%' }} min={1} addonAfter="ج.م" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="patientName" label="اسم العميلة المشترية (اختياري)">
            <Input placeholder="مثال: ياسمين عبد العزيز" />
          </Form.Item>

          <Form.Item name="notes" label="ملاحظات إضافية">
            <Input placeholder="مثال: عمولة مبيعات منتجات الروشتة الطبية" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsManualModalOpen(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#b45309', borderColor: '#b45309', fontWeight: 700 }}>
              تسجيل العمولة بالحساب
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Configure Commission Rules */}
      <Modal
        title={
          <Space>
            <ShieldCheck size={18} color="#047857" />
            <span style={{ fontWeight: 700 }}>إعداد نظام أجر ونسب الكادر الطبي</span>
          </Space>
        }
        open={isRulesModalOpen}
        onCancel={() => setIsRulesModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleSaveRule}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="doctorName" label="اسم الطبيب/ة أو الأخصائي/ة" rules={[{ required: true, message: 'مطلوب' }]}>
                <Input placeholder="مثال: د. سارة القاضي" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="roleType" label="الدور الوظيفي" initialValue="doctor" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'doctor', label: 'طبيب/ة معالج' },
                    { value: 'specialist', label: 'أخصائي/ة تجميل وبشرة' },
                    { value: 'nurse_tech', label: 'طاقم تمريض / فني ليزر' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="specialty" label="التخصص الدقيق" initialValue="ليزر وجلدية وتجميل">
            <Input placeholder="مثال: جراحة التجميل وحقن الفيلر" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="rateType" label="نظام احتساب الجلسات" initialValue="percentage" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'percentage', label: 'نسبة مئوية (%)' },
                    { value: 'fixed_per_session', label: 'مبلغ ثابت للجلسة (ج.م)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.rateType !== cur.rateType}
              >
                {({ getFieldValue }) =>
                  getFieldValue('rateType') === 'fixed_per_session' ? (
                    <Form.Item name="fixedRateEgp" label="المبلغ الثابت للجلسة" initialValue={150}>
                      <InputNumber style={{ width: '100%' }} min={1} addonAfter="ج.م" />
                    </Form.Item>
                  ) : (
                    <Form.Item name="percentageRate" label="النسبة المئوية للجلسة" initialValue={20}>
                      <InputNumber style={{ width: '100%' }} min={1} max={100} addonAfter="%" />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="productCommissionRate" label="نسبة عمولة مبيعات مستحضرات البشرة (%)" initialValue={10}>
            <InputNumber style={{ width: '100%' }} min={0} max={50} addonAfter="%" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsRulesModalOpen(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit" style={{ fontWeight: 700 }}>
              حفظ القواعد
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Printable Settlement Voucher Modal */}
      <Modal
        title="سند صرف مستحقات نقدية / تحويل"
        open={isVoucherPrintOpen}
        onCancel={() => setIsVoucherPrintOpen(false)}
        width={620}
        footer={[
          <Button key="close" onClick={() => setIsVoucherPrintOpen(false)}>إغلاق</Button>,
          <Button key="print" type="primary" icon={<Printer size={14} />} onClick={() => window.print()} style={{ background: '#047857', borderColor: '#047857' }}>
            طباعة السند
          </Button>,
        ]}
      >
        {selectedVoucher && (
          <div
            id="printable-voucher"
            style={{
              padding: 24,
              border: '2px solid #047857',
              borderRadius: 12,
              backgroundColor: '#fafafa',
              direction: 'rtl',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, color: '#064e3b', fontWeight: 800 }}>مركز إنتراستيك للتجميل والجلدية</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>Entrustic Beauty & Derma Clinic — قسم الحسابات المالية</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, color: '#047857', fontSize: 16 }}>{selectedVoucher.voucherNumber}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{dayjs(selectedVoucher.date).format('YYYY/MM/DD')}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '14px 0', padding: '10px 0', background: '#ecfdf5', borderRadius: 8, border: '1px dashed #10b981' }}>
              <span style={{ fontSize: 13, color: '#047857' }}>سند صرف مستحقات وعمولات كادر طبي</span>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#064e3b', marginTop: 4 }}>
                {selectedVoucher.amountEgp.toLocaleString()} جنيه مصري فقط لا غير
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, margin: '16px 0' }}>
              <div><strong>يصرف إلى السيد/ة:</strong> {selectedVoucher.doctorName}</div>
              <div><strong>طريقة الصرف:</strong> {selectedVoucher.paymentMethod === 'cash' ? 'نقداً من الخزينة' : selectedVoucher.paymentMethod === 'bank_transfer' ? 'تحويل بنكي / إنستاباي' : 'شيك'}</div>
              <div><strong>رقم المرجع / الإيصال:</strong> {selectedVoucher.referenceNo || '—'}</div>
              <div><strong>عدد الحركات المسواة:</strong> {selectedVoucher.settledEarningIds?.length || 1} حركة</div>
            </div>

            {selectedVoucher.notes && (
              <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 6, fontSize: 12, color: '#475569', marginBottom: 20 }}>
                <strong>البيان:</strong> {selectedVoucher.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, borderTop: '1px solid #cbd5e1', paddingTop: 16 }}>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>توقيع المستلم</div>
                <div style={{ height: 40, borderBottom: '1px dashed #94a3b8', margin: '8px 0' }}></div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{selectedVoucher.doctorName}</div>
              </div>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>اعتماد الإدارة المالية والخزينة</div>
                <div style={{ height: 40, borderBottom: '1px dashed #94a3b8', margin: '8px 0' }}></div>
                <div style={{ fontSize: 11, color: '#64748b' }}>الختم والتاريخ</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
