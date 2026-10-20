import { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Row, Col, Modal, Form,
  InputNumber, Select, Input, message,
} from 'antd';
import {
  CheckCircle2, Clock, UserCheck, Wallet,
  TrendingUp, Plus, FileText,
} from 'lucide-react';
import {
  getDoctorEarnings,
  getDoctorPayouts,
  getDoctorCommissionRules,
  payoutDoctorSettlement,
  DoctorEarningEntry,
  DoctorPayout,
  DoctorCommissionRule,
  saveDoctorCommissionRules,
} from '../../lib/doctorEarnings';

const { Text } = Typography;

export function DoctorSettlementsView() {
  const [earnings, setEarnings] = useState<DoctorEarningEntry[]>(getDoctorEarnings);
  const [, setPayouts] = useState<DoctorPayout[]>(getDoctorPayouts);
  const [rules, setRules] = useState<DoctorCommissionRule[]>(getDoctorCommissionRules);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accrued' | 'settled'>('all');

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [payoutDoctorName, setPayoutDoctorName] = useState<string>('');
  const [payoutForm] = Form.useForm();
  const [ruleForm] = Form.useForm();

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

  // Unique list of doctors from rules and earnings
  const allDoctors = useMemo(() => {
    const names = new Set<string>();
    rules.forEach((r) => names.add(r.doctorName));
    earnings.forEach((e) => names.add(e.doctorName));
    return Array.from(names);
  }, [rules, earnings]);

  // Aggregate doctor stats
  const doctorSummaries = useMemo(() => {
    return allDoctors.map((docName) => {
      const docEarnings = earnings.filter((e) => e.doctorName === docName);
      const totalEarned = docEarnings.reduce((s, e) => s + e.earnedAmountEgp, 0);
      const settledAmount = docEarnings.filter((e) => e.status === 'settled').reduce((s, e) => s + e.earnedAmountEgp, 0);
      const pendingBalance = totalEarned - settledAmount;
      const totalSessions = docEarnings.length;
      const totalRevenueGenerated = docEarnings.reduce((s, e) => s + e.servicePriceEgp, 0);

      const rule = rules.find((r) => r.doctorName === docName);
      const rateLabel = rule
        ? rule.rateType === 'fixed_per_session'
          ? `${rule.fixedRateEgp} ج.م / جلسة`
          : `${rule.percentageRate}%`
        : '20%';

      return {
        doctorName: docName,
        doctorId: rule?.doctorId || 'doc-custom',
        specialty: rule?.specialty || 'تخصص عام',
        rateLabel,
        totalSessions,
        totalRevenueGenerated,
        totalEarned,
        settledAmount,
        pendingBalance,
      };
    });
  }, [allDoctors, earnings, rules]);

  // Filtered earnings
  const filteredEarnings = useMemo(() => {
    return earnings.filter((e) => {
      const matchDoc = selectedDoctor === 'all' || e.doctorName === selectedDoctor;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchDoc && matchStatus;
    });
  }, [earnings, selectedDoctor, statusFilter]);

  const totalAccruedPending = useMemo(() => {
    return earnings.filter((e) => e.status === 'accrued').reduce((s, e) => s + e.earnedAmountEgp, 0);
  }, [earnings]);

  const totalSettledPaid = useMemo(() => {
    return earnings.filter((e) => e.status === 'settled').reduce((s, e) => s + e.earnedAmountEgp, 0);
  }, [earnings]);

  const handleOpenPayout = (docName: string, maxAmount: number) => {
    setPayoutDoctorName(docName);
    const docSummary = doctorSummaries.find((d) => d.doctorName === docName);
    payoutForm.setFieldsValue({
      amountEgp: maxAmount > 0 ? maxAmount : 0,
      paymentMethod: 'cash',
      doctorName: docName,
      doctorId: docSummary?.doctorId || 'doc-1',
    });
    setIsPayoutModalOpen(true);
  };

  const handleSavePayout = (values: any) => {
    payoutDoctorSettlement({
      doctorId: values.doctorId || 'doc-1',
      doctorName: values.doctorName || payoutDoctorName,
      amountEgp: Number(values.amountEgp),
      paymentMethod: values.paymentMethod || 'cash',
      referenceNo: values.referenceNo,
      notes: values.notes,
    });
    message.success(`✅ تم صرف مستحقات بقيمة ${Number(values.amountEgp).toLocaleString()} ج.م للطبيب/ة [${values.doctorName || payoutDoctorName}] بنجاح`);
    setIsPayoutModalOpen(false);
    payoutForm.resetFields();
    refreshData();
  };

  const handleSaveRule = (values: any) => {
    const existingIndex = rules.findIndex((r) => r.doctorName === values.doctorName);
    let next: DoctorCommissionRule[];
    const newRule: DoctorCommissionRule = {
      doctorId: values.doctorId || `doc-${Date.now()}`,
      doctorName: values.doctorName,
      specialty: values.specialty || 'تجميل وجلدية',
      rateType: values.rateType || 'percentage',
      percentageRate: values.percentageRate || 20,
      fixedRateEgp: values.fixedRateEgp || 150,
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

  const doctorColumns = [
    {
      title: 'الطبيب/ة أو الأخصائي/ة',
      key: 'doc',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{r.doctorName}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.specialty}</div>
        </div>
      ),
    },
    {
      title: 'نظام التعاقد',
      dataIndex: 'rateLabel',
      key: 'rate',
      render: (v: string) => <Tag color="purple" style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: 'الجلسات المنفذة',
      dataIndex: 'totalSessions',
      key: 'sessions',
      render: (v: number) => <Tag color="blue">{v} جلسة</Tag>,
    },
    {
      title: 'قيمة الخدمات المنفذة',
      dataIndex: 'totalRevenueGenerated',
      key: 'rev',
      render: (v: number) => <Text style={{ fontWeight: 600 }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'إجمالي المستحق المكتسب',
      dataIndex: 'totalEarned',
      key: 'earned',
      render: (v: number) => <Text style={{ color: '#059669', fontWeight: 700 }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'المدفوع',
      dataIndex: 'settledAmount',
      key: 'settled',
      render: (v: number) => <Text style={{ color: '#0284c7' }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'الرصيد المتبقي للصرف',
      dataIndex: 'pendingBalance',
      key: 'balance',
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#dc2626' : '#059669', fontWeight: 800, fontSize: 14 }}>
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
          style={{ background: r.pendingBalance > 0 ? '#059669' : undefined, borderColor: '#059669' }}
        >
          صرف المستحقات
        </Button>
      ),
    },
  ];

  const earningColumns = [
    {
      title: 'تاريخ وساعة الجلسة',
      key: 'time',
      render: (_: any, r: DoctorEarningEntry) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.date}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.time}</Text>
        </div>
      ),
    },
    {
      title: 'الطبيب/ة',
      dataIndex: 'doctorName',
      key: 'doc',
      render: (v: string) => <Tag color="cyan">{v}</Tag>,
    },
    {
      title: 'الحالة / العميلة',
      dataIndex: 'patientName',
      key: 'patient',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'الإجراء المنفذ',
      key: 'service',
      render: (_: any, r: DoctorEarningEntry) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.serviceName}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.notes || r.serviceCategory}</Text>
        </div>
      ),
    },
    {
      title: 'سعر الجلسة',
      dataIndex: 'servicePriceEgp',
      key: 'price',
      render: (v: number) => <Text>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'النسبة / الأجر',
      key: 'rate',
      render: (_: any, r: DoctorEarningEntry) => (
        <Tag color="geekblue">
          {r.rateType === 'fixed_per_session' ? `${r.commissionRate} ج.م` : `${r.commissionRate}%`}
        </Tag>
      ),
    },
    {
      title: 'المستحق المكتسب',
      dataIndex: 'earnedAmountEgp',
      key: 'earned',
      render: (v: number) => (
        <Text style={{ color: '#059669', fontWeight: 800 }}>{v.toLocaleString()} ج.م</Text>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #fed7aa', background: '#fffbeb' }}>
            <Space align="center" size={10}>
              <Clock size={20} color="#ea580c" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>إجمالي المستحقات المعلقة للأطباء</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>
                  {totalAccruedPending.toLocaleString()} ج.م
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
            <Space align="center" size={10}>
              <CheckCircle2 size={20} color="#16a34a" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>إجمالي المستحقات المسددة</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
                  {totalSettledPaid.toLocaleString()} ج.م
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
            <Space align="center" size={10}>
              <TrendingUp size={20} color="#2563eb" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>عدد الجلسات المحتسبة</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>
                  {earnings.length} جلسة منفذة
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Doctor Summary Table */}
      <Card
        style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
        title={
          <Space>
            <UserCheck size={18} color="#059669" />
            <Text strong>مستحقات وأرصدة الأطباء والأخصائيات</Text>
          </Space>
        }
        extra={
          <Button
            size="small"
            icon={<Plus size={14} />}
            onClick={() => {
              ruleForm.resetFields();
              setIsRulesModalOpen(true);
            }}
          >
            تعديل قواعد نسب الأطباء
          </Button>
        }
      >
        <Table
          dataSource={doctorSummaries}
          columns={doctorColumns}
          rowKey="doctorName"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Detailed Sessions Breakdown */}
      <Card
        style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}
        title={
          <Space>
            <FileText size={18} color="#2563eb" />
            <Text strong>سجل استحقاقات الجلسات المنفذة بالتفصيل</Text>
            <Tag color="blue">{filteredEarnings.length} حركة</Tag>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={selectedDoctor}
              onChange={setSelectedDoctor}
              style={{ width: 170 }}
              options={[
                { value: 'all', label: 'جميع الأطباء' },
                ...allDoctors.map((d) => ({ value: d, label: d })),
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
              options={[
                { value: 'all', label: 'كل الحالات' },
                { value: 'accrued', label: 'مستحق معلق' },
                { value: 'settled', label: 'تم الصرف' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={filteredEarnings}
          columns={earningColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal: Payout Doctor Settlement */}
      <Modal
        title={`صرف مستحقات الطبيب/ة: ${payoutDoctorName}`}
        open={isPayoutModalOpen}
        onCancel={() => setIsPayoutModalOpen(false)}
        footer={null}
      >
        <Form form={payoutForm} layout="vertical" onFinish={handleSavePayout}>
          <Form.Item name="doctorId" hidden><Input /></Form.Item>
          <Form.Item name="doctorName" hidden><Input /></Form.Item>

          <Form.Item name="amountEgp" label="المبلغ المراد صرفه (ج.م)" rules={[{ required: true, message: 'مطلوب' }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={1} />
          </Form.Item>

          <Form.Item name="paymentMethod" label="طريقة الصرف" initialValue="cash" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'cash', label: 'نقداً من الخزينة' },
                { value: 'bank_transfer', label: 'تحويل بنكي / فودافون كاش / إنستاباي' },
                { value: 'cheque', label: 'شيك مصرفي' },
              ]}
            />
          </Form.Item>

          <Form.Item name="referenceNo" label="رقم السند أو الإيصال أو التحويل">
            <Input placeholder="مثال: REF-99210 أو إيصال صرف نقدية رقم 14" />
          </Form.Item>

          <Form.Item name="notes" label="ملاحظات الصرف">
            <Input.TextArea rows={2} placeholder="مثال: تسوية مستحقات الأسبوع الثاني من الشهر" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setIsPayoutModalOpen(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#059669', borderColor: '#059669' }}>
              تأكيد صرف المستحقات
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Configure Commission Rule */}
      <Modal
        title="إعداد نظام أجر ونسبة الطبيب"
        open={isRulesModalOpen}
        onCancel={() => setIsRulesModalOpen(false)}
        footer={null}
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleSaveRule}>
          <Form.Item name="doctorName" label="اسم الطبيب/ة أو الأخصائي/ة" rules={[{ required: true, message: 'مطلوب' }]}>
            <Input placeholder="مثال: د. سارة القاضي" />
          </Form.Item>

          <Form.Item name="specialty" label="التخصص" initialValue="ليزر وجلدية">
            <Input placeholder="مثال: جراحة التجميل وحقن الفيلر" />
          </Form.Item>

          <Form.Item name="rateType" label="نظام احتساب المستحقات" initialValue="percentage" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'percentage', label: 'نسبة مئوية من سعر الخدمة (%)' },
                { value: 'fixed_per_session', label: 'مبلغ مالي ثابت لكل جلسة (ج.م)' },
              ]}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.rateType !== cur.rateType}
          >
            {({ getFieldValue }) =>
              getFieldValue('rateType') === 'fixed_per_session' ? (
                <Form.Item name="fixedRateEgp" label="المبلغ الثابت لكل جلسة (ج.م)" initialValue={150}>
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              ) : (
                <Form.Item name="percentageRate" label="النسبة المئوية (%)" initialValue={20}>
                  <InputNumber style={{ width: '100%' }} min={1} max={100} addonAfter="%" />
                </Form.Item>
              )
            }
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setIsRulesModalOpen(false)}>إلغاء</Button>
            <Button type="primary" htmlType="submit">حفظ الإعدادات</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
