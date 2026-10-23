import { useState } from 'react';
import {
  Card,
  Button,
  Typography,
  InputNumber,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Statistic,
  message,
  Popconfirm,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Plus,
  PrinterCheck,
  ShieldCheck,
} from 'lucide-react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ShiftExpense {
  id: string;
  label: string;
  amount: number;
  at: string;
}

interface ShiftPayment {
  id: string;
  patientName: string;
  service: string;
  amount: number;
  method: 'cash' | 'card' | 'insurance';
  at: string;
}

interface Shift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  payments: ShiftPayment[];
  expenses: ShiftExpense[];
  status: 'open' | 'closed';
  closingCash?: number;
  notes?: string;
}

const LS_KEY = 'clinic_cashier_shift';

function loadShift(): Shift | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveShift(s: Shift | null) {
  if (s) localStorage.setItem(LS_KEY, JSON.stringify(s));
  else localStorage.removeItem(LS_KEY);
}

export function CashierView() {
  const [shift, setShift] = useState<Shift | null>(loadShift);
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const [payForm] = Form.useForm();
  const [expForm] = Form.useForm();
  const [openForm] = Form.useForm();
  const [closeForm] = Form.useForm();

  // ─── Derived totals ───
  const totalRevenue = shift ? shift.payments.reduce((s, p) => s + p.amount, 0) : 0;
  const totalExpenses = shift ? shift.expenses.reduce((s, e) => s + e.amount, 0) : 0;
  const netCash = (shift?.openingFloat ?? 0) + totalRevenue - totalExpenses;
  const cashRevenue = shift ? shift.payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0) : 0;
  const cardRevenue = shift ? shift.payments.filter((p) => p.method === 'card').reduce((s, p) => s + p.amount, 0) : 0;

  const handleOpenShift = (vals: any) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openingFloat: vals.float || 0,
      payments: [],
      expenses: [],
      status: 'open',
    };
    setShift(newShift);
    saveShift(newShift);
    setOpenShiftModal(false);
    openForm.resetFields();
    message.success('تم فتح الشفت');
  };

  const handleCloseShift = (vals: any) => {
    if (!shift) return;
    const closed: Shift = {
      ...shift,
      closedAt: new Date().toISOString(),
      status: 'closed',
      closingCash: vals.closingCash,
      notes: vals.notes,
    };
    setShift(closed);
    saveShift(closed);
    setCloseShiftModal(false);
    closeForm.resetFields();
    message.success('تم تقفيل الشفت');
  };

  const handleAddPayment = (vals: any) => {
    if (!shift) return;
    const pay: ShiftPayment = {
      id: `pay-${Date.now()}`,
      patientName: vals.patientName,
      service: vals.service || 'كشف',
      amount: vals.amount,
      method: vals.method || 'cash',
      at: new Date().toISOString(),
    };
    const updated = { ...shift, payments: [...shift.payments, pay] };
    setShift(updated);
    saveShift(updated);
    setAddPaymentModal(false);
    payForm.resetFields();
  };

  const handleAddExpense = (vals: any) => {
    if (!shift) return;
    const exp: ShiftExpense = {
      id: `exp-${Date.now()}`,
      label: vals.label,
      amount: vals.amount,
      at: new Date().toISOString(),
    };
    const updated = { ...shift, expenses: [...shift.expenses, exp] };
    setShift(updated);
    saveShift(updated);
    setAddExpenseModal(false);
    expForm.resetFields();
  };

  const handleNewShift = () => {
    saveShift(null);
    setShift(null);
  };

  const methodColor = { cash: 'green', card: 'blue', insurance: 'purple' } as Record<string, string>;
  const methodLabel = { cash: 'كاش', card: 'كارت', insurance: 'تأمين' } as Record<string, string>;

  const payColumns = [
    { title: 'المريض', dataIndex: 'patientName', key: 'p' },
    { title: 'الخدمة', dataIndex: 'service', key: 's' },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'a',
      render: (v: number) => <Text strong style={{ color: '#047857' }}>{v.toLocaleString()} ج.م</Text>,
    },
    {
      title: 'طريقة الدفع',
      dataIndex: 'method',
      key: 'm',
      render: (m: string) => <Tag color={methodColor[m]}>{methodLabel[m]}</Tag>,
    },
    {
      title: 'الوقت',
      dataIndex: 'at',
      key: 't',
      render: (d: string) => dayjs(d).format('HH:mm'),
    },
  ];

  const expColumns = [
    { title: 'البيان', dataIndex: 'label', key: 'l' },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'a',
      render: (v: number) => <Text strong style={{ color: '#B91C1C' }}>{v.toLocaleString()} ج.م</Text>,
    },
    { title: 'الوقت', dataIndex: 'at', key: 't', render: (d: string) => dayjs(d).format('HH:mm') },
  ];

  // ─── NO SHIFT ───
  if (!shift) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <DollarSign size={48} color="#CBD5E1" style={{ marginBottom: 12 }} />
        <Title level={4} style={{ color: '#0F172A' }}>لا يوجد شفت مفتوح</Title>
        <Text style={{ color: '#64748B', display: 'block', marginBottom: 24 }}>
          افتح الشفت لبدء تسجيل المدفوعات والمصروفات اليومية
        </Text>
        <Button type="primary" size="large" icon={<ShieldCheck size={16} />} onClick={() => setOpenShiftModal(true)}>
          فتح شفت اليوم
        </Button>

        <Modal title="فتح شفت جديد" open={openShiftModal} onCancel={() => setOpenShiftModal(false)} onOk={() => openForm.submit()} okText="فتح" cancelText="إلغاء">
          <Form form={openForm} layout="vertical" onFinish={handleOpenShift}>
            <Form.Item name="float" label="رصيد الدرج الابتدائي (ج.م)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="500" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // ─── SHIFT CLOSED ───
  const variance = shift.closingCash != null ? shift.closingCash - netCash : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>الكاشير — تقفيل اليومي</Title>
          <Text style={{ fontSize: 12, color: '#64748B' }}>
            {dayjs(shift.openedAt).format('dddd D MMMM YYYY')} —
            {shift.status === 'closed' ? <Tag color="red" style={{ marginInlineStart: 6 }}>مقفول</Tag> : <Tag color="green" style={{ marginInlineStart: 6 }}>مفتوح</Tag>}
          </Text>
        </div>
        <Space wrap>
          {shift.status === 'open' && (
            <>
              <Button icon={<Plus size={14} />} onClick={() => { payForm.resetFields(); setAddPaymentModal(true); }}>إيراد جديد</Button>
              <Button icon={<TrendingDown size={14} />} danger onClick={() => { expForm.resetFields(); setAddExpenseModal(true); }}>مصروف</Button>
              <Button type="primary" danger icon={<Lock size={14} />} onClick={() => { closeForm.resetFields(); setCloseShiftModal(true); }}>
                تقفيل الشفت
              </Button>
            </>
          )}
          {shift.status === 'closed' && (
            <Popconfirm title="فتح شفت جديد؟ سيتم حذف بيانات اليوم الحالي." onConfirm={handleNewShift} okText="نعم" cancelText="لا">
              <Button type="primary" icon={<ShieldCheck size={14} />}>شفت جديد</Button>
            </Popconfirm>
          )}
          <Button icon={<PrinterCheck size={14} />} onClick={() => window.print()}>طباعة التقرير</Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { title: 'إجمالي الإيرادات', value: totalRevenue, prefix: <TrendingUp size={16} />, color: '#047857', bg: '#ECFDF5' },
          { title: 'كاش', value: cashRevenue, prefix: <DollarSign size={16} />, color: '#0369A1', bg: '#EFF6FF' },
          { title: 'كارت/تحويل', value: cardRevenue, prefix: <DollarSign size={16} />, color: '#6D28D9', bg: '#EDE9FE' },
          { title: 'مصروفات', value: totalExpenses, prefix: <TrendingDown size={16} />, color: '#B91C1C', bg: '#FEF2F2' },
          { title: 'صافي الدرج', value: netCash, prefix: <DollarSign size={16} />, color: '#0F172A', bg: '#F8FAFC' },
        ].map((k) => (
          <Card key={k.title} size="small" style={{ flex: '1 1 140px', minWidth: 130, borderRadius: 10, backgroundColor: k.bg, border: `1px solid ${k.color}20` }} bodyStyle={{ padding: '10px 14px' }}>
            <Statistic
              title={<Text style={{ fontSize: 11, color: '#64748B' }}>{k.title}</Text>}
              value={k.value}
              suffix="ج.م"
              valueStyle={{ fontSize: 18, fontWeight: 700, color: k.color }}
              prefix={<span style={{ color: k.color, marginInlineEnd: 4 }}>{k.prefix}</span>}
            />
          </Card>
        ))}
      </div>

      {shift.status === 'closed' && (
        <Alert
          type={variance != null && Math.abs(variance) < 50 ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
          message={
            <span>
              الفرق بين المتوقع والفعلي:&nbsp;
              <strong style={{ color: variance != null && variance >= 0 ? '#047857' : '#B91C1C' }}>
                {variance != null ? `${variance >= 0 ? '+' : ''}${variance.toLocaleString()} ج.م` : '—'}
              </strong>
              &nbsp;| النقد الفعلي في الدرج: <strong>{(shift.closingCash || 0).toLocaleString()} ج.م</strong>
            </span>
          }
        />
      )}

      {/* Payments Table */}
      <Card
        size="small"
        title={<Space><TrendingUp size={14} color="#047857" /><span>الإيرادات ({shift.payments.length})</span></Space>}
        style={{ borderRadius: 10, marginBottom: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={shift.payments}
          columns={payColumns}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'لا توجد مدفوعات بعد' }}
        />
        {shift.payments.length > 0 && (
          <div style={{ padding: '8px 16px', textAlign: 'end', borderTop: '1px solid #F1F5F9' }}>
            <Text strong style={{ color: '#047857' }}>الإجمالي: {totalRevenue.toLocaleString()} ج.م</Text>
          </div>
        )}
      </Card>

      {/* Expenses Table */}
      <Card
        size="small"
        title={<Space><TrendingDown size={14} color="#B91C1C" /><span>المصروفات ({shift.expenses.length})</span></Space>}
        style={{ borderRadius: 10, marginBottom: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={shift.expenses}
          columns={expColumns}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'لا توجد مصروفات' }}
        />
        {shift.expenses.length > 0 && (
          <div style={{ padding: '8px 16px', textAlign: 'end', borderTop: '1px solid #F1F5F9' }}>
            <Text strong style={{ color: '#B91C1C' }}>الإجمالي: {totalExpenses.toLocaleString()} ج.م</Text>
          </div>
        )}
      </Card>

      {/* Closeout Summary */}
      <Card size="small" style={{ borderRadius: 10, backgroundColor: '#F8FAFC' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Text style={{ color: '#64748B', fontSize: 12 }}>رصيد الدرج الابتدائي</Text>
            <Text strong style={{ display: 'block', fontSize: 16 }}>{(shift.openingFloat || 0).toLocaleString()} ج.م</Text>
          </div>
          <div style={{ color: '#64748B', fontSize: 20 }}>+</div>
          <div>
            <Text style={{ color: '#64748B', fontSize: 12 }}>إجمالي الإيرادات</Text>
            <Text strong style={{ display: 'block', fontSize: 16, color: '#047857' }}>{totalRevenue.toLocaleString()} ج.م</Text>
          </div>
          <div style={{ color: '#64748B', fontSize: 20 }}>−</div>
          <div>
            <Text style={{ color: '#64748B', fontSize: 12 }}>المصروفات</Text>
            <Text strong style={{ display: 'block', fontSize: 16, color: '#B91C1C' }}>{totalExpenses.toLocaleString()} ج.م</Text>
          </div>
          <Divider type="vertical" style={{ height: 40 }} />
          <div style={{ textAlign: 'end' }}>
            <Text style={{ color: '#64748B', fontSize: 12 }}>صافي الدرج المتوقع</Text>
            <Text strong style={{ display: 'block', fontSize: 22, color: '#0F172A' }}>{netCash.toLocaleString()} ج.م</Text>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <Modal title="إضافة إيراد" open={addPaymentModal} onCancel={() => setAddPaymentModal(false)} onOk={() => payForm.submit()} okText="إضافة" cancelText="إلغاء">
        <Form form={payForm} layout="vertical" onFinish={handleAddPayment}>
          <Form.Item name="patientName" label="اسم المريض" rules={[{ required: true }]}>
            <Input placeholder="أحمد محمد" />
          </Form.Item>
          <Form.Item name="service" label="الخدمة">
            <Input placeholder="كشف، عصب، حشو..." />
          </Form.Item>
          <Form.Item name="amount" label="المبلغ (ج.م)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label="طريقة الدفع" initialValue="cash">
            <select style={{ width: '100%', padding: '4px 8px', border: '1px solid #D9D9D9', borderRadius: 6 }}>
              <option value="cash">كاش</option>
              <option value="card">كارت / تحويل</option>
              <option value="insurance">تأمين</option>
            </select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="إضافة مصروف" open={addExpenseModal} onCancel={() => setAddExpenseModal(false)} onOk={() => expForm.submit()} okText="إضافة" cancelText="إلغاء">
        <Form form={expForm} layout="vertical" onFinish={handleAddExpense}>
          <Form.Item name="label" label="بيان المصروف" rules={[{ required: true }]}>
            <Input placeholder="مثال: كهرباء، مواد طبية، صيانة..." />
          </Form.Item>
          <Form.Item name="amount" label="المبلغ (ج.م)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="تقفيل الشفت" open={closeShiftModal} onCancel={() => setCloseShiftModal(false)} onOk={() => closeForm.submit()} okText="تقفيل" okButtonProps={{ danger: true }} cancelText="إلغاء">
        <Alert type="info" showIcon message={`الصافي المتوقع في الدرج: ${netCash.toLocaleString()} ج.م`} style={{ marginBottom: 16, borderRadius: 8 }} />
        <Form form={closeForm} layout="vertical" onFinish={handleCloseShift}>
          <Form.Item name="closingCash" label="النقد الفعلي في الدرج (ج.م)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="ملاحظات الإغلاق">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
