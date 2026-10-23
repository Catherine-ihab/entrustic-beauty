import { useState, useMemo, useEffect } from 'react';
import {
  Table, Button, Tag, Modal, Form, Select, Typography, message,
  InputNumber, Progress, Space, Segmented, Divider,
  Row, Col, Card, Alert,
} from 'antd';
import { IInvoice, InvoiceStatus } from '@clinic/shared-types';
import {
  Plus, CreditCard, Receipt, Wallet, Trash2, ShoppingCart,
  User, DollarSign, CheckCircle2, Send, Ticket, UserCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import { CashierView } from '../cashier/CashierView';
import { DoctorSettlementsView } from './DoctorSettlementsView';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';
import { addToQueue, detectServiceCategory, getQueue, subscribeToQueue, QueueEntry } from '../../lib/clinicQueue';
import {
  getClinicPackages,
  ClinicPackage,
  subscribeToPackages,
  enrollClientPackage,
} from '../../lib/packagesDirectory';
import {
  getClinicInvoices,
  addClinicInvoice,
  recordInvoicePayment,
  subscribeToInvoices,
} from '../../lib/clinicInvoices';

const { Title, Text } = Typography;

// Load clinic services from localStorage (set by ServicesView)
function loadClinicServices(): Array<{ id: string; name: string; price: number; description: string }> {
  // Try to load from all known specialty storage keys
  const knownKeys = [
    'clinic_services_aesthetic_current-clinic',
    'clinic_services_AESTHETIC_current-clinic',
    'clinic_services_aesthetic_demo',
  ];

  for (const key of knownKeys) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.currentPrice || s.price || 0,
            description: s.description || '',
          }));
        }
      }
    } catch (_) {}
  }

  // Fallback default services for aesthetic clinic
  return [
    { id: 'def-1', name: 'استشارة تجميلية أولية', price: 300, description: 'تقييم شامل للوجه وخطة علاجية' },
    { id: 'def-2', name: 'جلسة تقشير كيميائي', price: 600, description: 'تجديد وتصحيح تصبغات البشرة' },
    { id: 'def-3', name: 'جلسة ليزر إزالة شعر', price: 700, description: 'ليزر الكساندريت / Nd:YAG المزدوج' },
    { id: 'def-4', name: 'حقن بوتوكس للتجاعيد', price: 1500, description: 'توكسين عصبي من نوع A للخطوط الحركية' },
    { id: 'def-5', name: 'حقن فيلر حمض الهيالورونيك', price: 2500, description: 'استعادة الحجم وتجميل الشفاه' },
    { id: 'def-6', name: 'جلسة هيدرافيشل سينديو', price: 1200, description: 'تنظيف مائي عميق وتغذية للبشرة' },
    { id: 'def-7', name: 'ماسك الذهب 24K', price: 400, description: 'شد وتوهج وتحفيز الكولاجين' },
    { id: 'def-8', name: 'جلسة قناع الضوء العلاجي LED', price: 250, description: 'علاج ضوئي للنضارة أو الأكنة' },
    { id: 'def-9', name: 'ديرمابن ميكرونيدلينج', price: 800, description: 'تحفيز كولاجين وتضييق مسام الوجه' },
    { id: 'def-10', name: 'مراجعة ما بعد الجلسة', price: 250, description: 'تقييم التعافي والتعديلات اللازمة' },
  ];
}

interface InvoiceLineItem {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export function InvoicesView({ currency = 'EGP' }: { currency?: string }) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'cashier' | 'doctor-settlements'>('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModalId, setPayModalId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();

  // Patient search state
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);
  const [selectedPatient, setSelectedPatient] = useState<RegisteredPatient | null>(null);

  // Line items state (services added to invoice)
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<number>(0);

  // Available services and packages from clinic catalogs
  const [clinicServices, setClinicServices] = useState(() => loadClinicServices());
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [clinicPackages, setClinicPackages] = useState<ClinicPackage[]>(getClinicPackages);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [matchedAppointment, setMatchedAppointment] = useState<any | null>(null);

  // Reload clinic services and packages when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setClinicServices(loadClinicServices());
      setClinicPackages(getClinicPackages());
    }
  }, [isModalOpen]);

  useEffect(() => {
    const unsub = subscribeToPackages(() => {
      setClinicPackages(getClinicPackages());
    });
    return () => unsub();
  }, []);

  const handleSelectPatient = (patient: RegisteredPatient | null) => {
    setSelectedPatient(patient);
    if (!patient) {
      setMatchedAppointment(null);
      return;
    }
    try {
      const raw = localStorage.getItem('clinic_appointments_unified_v3');
      if (raw) {
        const appts = JSON.parse(raw);
        const today = dayjs().format('YYYY-MM-DD');
        const found = appts.find(
          (a: any) =>
            a.date === today &&
            (a.name === patient.name || a.phone === patient.phone || a.patientNumber === patient.patientNumber)
        );
        setMatchedAppointment(found || null);
        return;
      }
    } catch {}
    setMatchedAppointment(null);
  };

  // Calculated totals
  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.lineTotal, 0), [lineItems]);
  const finalTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const remaining = useMemo(() => Math.max(0, finalTotal - paidNow), [finalTotal, paidNow]);

  const addServiceToInvoice = (serviceId: string) => {
    const service = clinicServices.find((s) => s.id === serviceId);
    if (!service) return;

    const existing = lineItems.find((item) => item.serviceId === serviceId);
    if (existing) {
      setLineItems(lineItems.map((item) =>
        item.serviceId === serviceId
          ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setLineItems([
        ...lineItems,
        {
          serviceId: service.id,
          serviceName: service.name,
          unitPrice: service.price,
          quantity: 1,
          lineTotal: service.price,
        },
      ]);
    }
    setSelectedServiceId(undefined);
  };

  const addPackageToInvoice = (pkgId: string) => {
    const pkg = clinicPackages.find((p) => p.id === pkgId);
    if (!pkg) return;
    const existing = lineItems.find((item) => item.serviceId === pkgId);
    if (existing) {
      setLineItems(
        lineItems.map((item) =>
          item.serviceId === pkgId
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          serviceId: pkg.id,
          serviceName: `باكدج: ${pkg.name} (${pkg.totalSessions} جلسات)`,
          unitPrice: pkg.priceEgp,
          quantity: 1,
          lineTotal: pkg.priceEgp,
        },
      ]);
    }
    setPackageTotalCount(pkg.totalSessions);
    setPackageSessionNum(1);
    setSelectedPackageId(undefined);
    message.success(`تمت إضافة الباقة [${pkg.name}] إلى الفاتورة`);
  };

  const removeLineItem = (serviceId: string) => {
    setLineItems(lineItems.filter((item) => item.serviceId !== serviceId));
  };

  const updateLineItemQty = (serviceId: string, qty: number) => {
    setLineItems(lineItems.map((item) =>
      item.serviceId === serviceId
        ? { ...item, quantity: qty, lineTotal: qty * item.unitPrice }
        : item
    ));
  };

  // Queue integration state
  const [liveQueue, setLiveQueue] = useState<QueueEntry[]>([]);
  const [sendToDoctorNow, setSendToDoctorNow] = useState<boolean>(true);
  const [packageSessionNum, setPackageSessionNum] = useState<number>(1);
  const [packageTotalCount, setPackageTotalCount] = useState<number>(4);
  const [scheduledQueueTime, setScheduledQueueTime] = useState<string>(() => dayjs().format('hh:mm A'));

  useEffect(() => {
    const refreshQueue = () => setLiveQueue(getQueue());
    refreshQueue();
    const unsub = subscribeToQueue(refreshQueue);
    return () => unsub();
  }, []);

  const resetModal = () => {
    setLineItems([]);
    setDiscountAmount(0);
    setPaidNow(0);
    setSelectedPatient(null);
    setSelectedServiceId(undefined);
    setSelectedPackageId(undefined);
    setMatchedAppointment(null);
    setSendToDoctorNow(true);
    setPackageSessionNum(1);
    setPackageTotalCount(4);
    setScheduledQueueTime(dayjs().format('hh:mm A'));
    form.resetFields();
  };

  const [invoices, setInvoices] = useState<IInvoice[]>(getClinicInvoices);

  useEffect(() => {
    const unsubInv = subscribeToInvoices(() => {
      setInvoices(getClinicInvoices());
    });
    return () => unsubInv();
  }, []);

  const handleCreate = () => {
    if (!selectedPatient) {
      message.error('برجاء اختيار الحالة / العميلة أولاً');
      return;
    }
    if (lineItems.length === 0) {
      message.error('برجاء إضافة خدمة واحدة على الأقل للفاتورة');
      return;
    }

    const invId = `inv-${Date.now()}`;
    const newInvoice: IInvoice = {
      id: invId,
      clinicId: 'clinic-1',
      patientId: selectedPatient.id,
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(5, '0')}`,
      currency,
      issueDate: new Date().toISOString(),
      subtotal,
      discountAmount,
      taxAmount: 0.0,
      total: finalTotal,
      paidAmount: Math.min(paidNow, finalTotal),
      status:
        paidNow >= finalTotal
          ? InvoiceStatus.PAID
          : paidNow > 0
          ? InvoiceStatus.PARTIALLY_PAID
          : InvoiceStatus.ISSUED,
      items: lineItems.map((item, idx) => ({
        id: `item-${invId}-${idx}`,
        clinicId: 'clinic-1',
        invoiceId: invId,
        description: `${item.serviceName} — ${selectedPatient.name} (${selectedPatient.patientNumber})`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to persistent storage and broadcast
    addClinicInvoice(newInvoice);

    // If invoice includes any package, automatically enroll patient into active packages!
    lineItems.forEach((li) => {
      const matchedPkg = clinicPackages.find((cp) => cp.id === li.serviceId || li.serviceName.includes(cp.name));
      if (matchedPkg || li.serviceName.includes('باكدج')) {
        const totalSessions = matchedPkg ? matchedPkg.totalSessions : packageTotalCount;
        const cat = matchedPkg ? matchedPkg.category : 'باكدج ميكس شامل';
        const isFullPaid = paidNow >= finalTotal;
        enrollClientPackage({
          patientName: selectedPatient.name,
          patientId: selectedPatient.patientNumber || selectedPatient.id,
          patientPhone: selectedPatient.phone,
          packageName: matchedPkg ? matchedPkg.name : li.serviceName,
          category: cat,
          totalSessions: totalSessions,
          completedSessions: 0,
          remainingSessions: totalSessions,
          priceEgp: li.lineTotal,
          paymentStatus: isFullPaid ? 'مدفوع بالكامل' : paidNow > 0 ? 'تقسيط / دفعة مقدمة' : 'معلق',
          paidAmountEgp: Math.min(paidNow, li.lineTotal),
          purchaseDate: dayjs().format('YYYY-MM-DD'),
          expiryDate: dayjs().add(matchedPkg?.validityMonths || 12, 'month').format('YYYY-MM-DD'),
          status: 'نشطة',
        });
      }
    });

    // Link to Appointments: Mark matching appointment completed in Appointments store
    try {
      const raw = localStorage.getItem('clinic_appointments_unified_v3');
      if (raw) {
        const appts = JSON.parse(raw);
        const today = dayjs().format('YYYY-MM-DD');
        const updated = appts.map((a: any) => {
          if (
            (matchedAppointment && a.id === matchedAppointment.id) ||
            (a.date === today && (a.name === selectedPatient.name || a.phone === selectedPatient.phone))
          ) {
            return { ...a, status: 'completed' };
          }
          return a;
        });
        localStorage.setItem('clinic_appointments_unified_v3', JSON.stringify(updated));
      }
    } catch (_) {}

    // Send patient directly to daily queue so doctor immediately sees them!
    if (sendToDoctorNow && lineItems.length > 0) {
      const mainItem = lineItems[0];
      const category = detectServiceCategory(mainItem.serviceName);
      addToQueue({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
        patientNumber: selectedPatient.patientNumber,
        serviceName: lineItems.map((li) => li.serviceName).join(' + '),
        serviceCategory: category,
        packageName: lineItems.some((li) => li.serviceName.includes('باكدج') || li.quantity > 1)
          ? mainItem.serviceName
          : undefined,
        packageSessionNumber: packageSessionNum,
        packageTotalSessions: packageTotalCount,
        invoiceId: invId,
        invoiceNumber: newInvoice.invoiceNumber,
        paidAmount: Math.min(paidNow, finalTotal),
        totalAmount: finalTotal,
        isPaid: paidNow >= finalTotal,
        scheduledTime: scheduledQueueTime || dayjs().format('hh:mm A'),
        status: 'waiting',
      });
      message.info(`🚀 تم إرسال الحالة [${selectedPatient.name}] مباشرة لطابور الطبيبة`);
    }

    setIsModalOpen(false);
    resetModal();
    message.success(`✅ تم إنشاء الفاتورة ${newInvoice.invoiceNumber} بإجمالي ${finalTotal.toLocaleString()} ج.م`);
  };

  const sendInvoiceToDoctor = (inv: IInvoice) => {
    const pName = patientNameMap[inv.patientId] || 'حالة مسجلة';
    const patientObj = registeredPatients.find((p) => p.id === inv.patientId);
    const serviceDesc = inv.items && inv.items.length > 0 ? inv.items[0].description : 'جلسة علاجية';
    const cleanServiceName = serviceDesc.split('—')[0].trim();
    const category = detectServiceCategory(cleanServiceName);

    addToQueue({
      patientId: inv.patientId,
      patientName: pName,
      patientPhone: patientObj?.phone || '',
      patientNumber: patientObj?.patientNumber || 'PAT-00000',
      serviceName: cleanServiceName,
      serviceCategory: category,
      packageSessionNumber: 1,
      packageTotalSessions: 4,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      paidAmount: Number(inv.paidAmount),
      totalAmount: Number(inv.total),
      isPaid: Number(inv.paidAmount) >= Number(inv.total),
      scheduledTime: dayjs().format('hh:mm A'),
      status: 'waiting',
    });

    message.success(`🚀 تم إرسال الحالة (${pName}) لقائمة انتظار الطبيبة بنجاح`);
  };

  const handleRecordPayment = (values: any) => {
    if (!payModalId) return;
    recordInvoicePayment(payModalId, Number(values.amount));
    setPayModalId(null);
    payForm.resetFields();
    message.success('✅ تم تسجيل الدفعة بنجاح');
  };

  const statusColorMap: Record<string, string> = {
    [InvoiceStatus.ISSUED]: 'blue',
    [InvoiceStatus.PAID]: 'green',
    [InvoiceStatus.PARTIALLY_PAID]: 'orange',
    [InvoiceStatus.OVERDUE]: 'red',
    [InvoiceStatus.CANCELLED]: 'default',
  };

  const statusLabelAr: Record<string, string> = {
    [InvoiceStatus.ISSUED]: 'صادرة',
    [InvoiceStatus.PAID]: 'مدفوعة ✓',
    [InvoiceStatus.PARTIALLY_PAID]: 'دفعة جزئية',
    [InvoiceStatus.OVERDUE]: 'متأخرة',
    [InvoiceStatus.CANCELLED]: 'ملغية',
  };

  // Patient name lookup
  const patientNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    registeredPatients.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [registeredPatients]);

  const columns = [
    {
      title: 'رقم الفاتورة',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (num: string) => <Tag color="cyan" style={{ fontWeight: 600 }}>{num}</Tag>,
    },
    {
      title: 'العميلة / الحالة',
      dataIndex: 'patientId',
      key: 'patientId',
      render: (pid: string, r: IInvoice) => {
        const name = patientNameMap[pid];
        const item = r.items?.[0];
        const fromDesc = item?.description?.match(/— (.+?) \(/)?.[1];
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{name || fromDesc || pid}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(r.issueDate).format('YYYY-MM-DD')}</Text>
          </div>
        );
      },
    },
    {
      title: 'الإجمالي قبل الخصم',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (v: number, r: IInvoice) => (
        <div>
          <Text>{Number(v).toLocaleString()} {r.currency}</Text>
          {Number(r.discountAmount) > 0 && (
            <div style={{ fontSize: 11, color: '#047857' }}>
              خصم: {Number(r.discountAmount).toLocaleString()} {r.currency}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'صافي الفاتورة',
      key: 'total',
      render: (_: any, r: IInvoice) => (
        <Text strong style={{ fontSize: 14 }}>{Number(r.total).toLocaleString()} {r.currency}</Text>
      ),
    },
    {
      title: 'المدفوع',
      key: 'paidAmount',
      render: (_: any, r: IInvoice) => (
        <Text style={{ color: '#047857', fontWeight: 600 }}>{Number(r.paidAmount).toLocaleString()} {r.currency}</Text>
      ),
    },
    {
      title: 'المتبقي',
      key: 'remaining',
      render: (_: any, r: IInvoice) => {
        const rem = Number(r.total) - Number(r.paidAmount);
        return rem > 0 ? (
          <Text strong style={{ color: '#B91C1C' }}>{rem.toLocaleString()} {r.currency}</Text>
        ) : (
          <Text style={{ color: '#047857' }}>مسدد ✓</Text>
        );
      },
    },
    {
      title: 'نسبة السداد',
      key: 'progress',
      width: 130,
      render: (_: any, r: IInvoice) => {
        const pct = Math.round((Number(r.paidAmount) / Number(r.total)) * 100);
        return (
          <div>
            <Progress
              percent={pct}
              size="small"
              strokeColor={pct === 100 ? '#047857' : '#F59E0B'}
              showInfo={false}
              style={{ marginBottom: 2 }}
            />
            <Text style={{ fontSize: 11, color: '#64748B' }}>{pct}%</Text>
          </div>
        );
      },
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => <Tag color={statusColorMap[st] || 'default'}>{statusLabelAr[st] || st}</Tag>,
    },
    {
      title: 'إجراءات وخطة الكشف',
      key: 'action',
      render: (_: any, r: IInvoice) => {
        const rem = Number(r.total) - Number(r.paidAmount);
        const queueItem = liveQueue.find((q) => q.invoiceId === r.id);

        return (
          <Space size={6} wrap>
            {rem > 0 && (
              <Button
                size="small"
                type="primary"
                icon={<CreditCard size={12} />}
                style={{ borderRadius: 6, fontSize: 11, backgroundColor: '#047857', borderColor: '#047857' }}
                onClick={() => {
                  payForm.setFieldsValue({ amount: rem });
                  setPayModalId(r.id);
                }}
              >
                دفعة
              </Button>
            )}

            {queueItem ? (
              <Tag
                color={
                  queueItem.status === 'in-progress'
                    ? 'green'
                    : queueItem.status === 'done'
                    ? 'default'
                    : queueItem.status === 'calling'
                    ? 'gold'
                    : 'purple'
                }
                style={{ fontWeight: 600, fontSize: 11, margin: 0 }}
              >
                {queueItem.status === 'in-progress'
                  ? 'في الغرفة مع الدكتورة'
                  : queueItem.status === 'done'
                  ? 'تمت الجلسة ✓'
                  : queueItem.status === 'calling'
                  ? 'يتم النداء'
                  : 'بالطابور (في الانتظار)'}
              </Tag>
            ) : (
              <Button
                size="small"
                icon={<Send size={12} />}
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  borderColor: '#BE123C',
                  color: '#be185d',
                  fontWeight: 600,
                  backgroundColor: '#fff1f2',
                }}
                onClick={() => sendInvoiceToDoctor(r)}
              >
                إرسال للطبيبة
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const totalOutstanding = invoices.reduce((s, i) => s + Math.max(0, Number(i.total) - Number(i.paidAmount)), 0);
  const totalCollected = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ margin: 0 }}>الفواتير والخزينة والأقساط</Title>
          <Segmented
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'invoices' | 'cashier' | 'doctor-settlements')}
            options={[
              { value: 'invoices', label: <Space size={4}><Receipt size={14} /> فواتير الخدمات والأقساط</Space> },
              { value: 'cashier', label: <Space size={4}><Wallet size={14} /> الخزينة وورديات الكاشير</Space> },
              { value: 'doctor-settlements', label: <Space size={4}><UserCheck size={14} /> مستحقات وعمولات الأطباء</Space> },
            ]}
          />
        </div>
        {activeTab === 'invoices' && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            style={{ backgroundColor: '#be185d', borderColor: '#be185d', fontWeight: 700 }}
            onClick={() => { setIsModalOpen(true); resetModal(); }}
          >
            فاتورة جديدة
          </Button>
        )}
      </div>

      {activeTab === 'doctor-settlements' ? (
        <DoctorSettlementsView />
      ) : activeTab === 'cashier' ? (
        <CashierView />
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <Text style={{ fontSize: 11, color: '#64748B', display: 'block' }}>إجمالي المحصّل</Text>
              <div style={{ fontWeight: 800, color: '#047857', fontSize: 16 }}>{totalCollected.toLocaleString()} {currency}</div>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Text style={{ fontSize: 11, color: '#64748B', display: 'block' }}>متبقي (غير محصّل)</Text>
              <div style={{ fontWeight: 800, color: '#B91C1C', fontSize: 16 }}>{totalOutstanding.toLocaleString()} {currency}</div>
            </div>
            <div style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Text style={{ fontSize: 11, color: '#64748B', display: 'block' }}>إجمالي الفواتير</Text>
              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>{invoices.length} فاتورة</div>
            </div>
          </div>

          <Table
            dataSource={invoices}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ margin: '8px 0' }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>📋 بنود الفاتورة:</Text>
                  <Table
                    dataSource={record.items || []}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    style={{ marginTop: 4 }}
                    columns={[
                      { title: 'الخدمة', dataIndex: 'description', key: 'desc', render: (d: string) => <span style={{ fontWeight: 500 }}>{d}</span> },
                      { title: 'الكمية', dataIndex: 'quantity', key: 'qty', width: 70 },
                      { title: 'سعر الوحدة', dataIndex: 'unitPrice', key: 'unit', width: 130, render: (p: number) => `${Number(p).toLocaleString()} ${record.currency}` },
                      { title: 'الإجمالي', dataIndex: 'lineTotal', key: 'total', width: 130, render: (t: number) => <Text strong>{Number(t).toLocaleString()} {record.currency}</Text> },
                    ]}
                  />
                  {Number(record.discountAmount) > 0 && (
                    <div style={{ textAlign: 'left', marginTop: 8, color: '#047857', fontWeight: 600 }}>
                      🎁 خصم مطبق: {Number(record.discountAmount).toLocaleString()} {record.currency}
                    </div>
                  )}
                </div>
              ),
            }}
          />
        </>
      )}

      {/* ======= CREATE INVOICE MODAL (Full Smart Builder) ======= */}
      <Modal
        title={
          <Space>
            <Receipt size={18} color="#be185d" />
            <span style={{ fontWeight: 700 }}>إنشاء فاتورة جديدة للعميلة</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); resetModal(); }}
        onOk={handleCreate}
        okText={`✅ إنشاء الفاتورة — ${finalTotal.toLocaleString()} ج.م`}
        cancelText="إلغاء"
        width={760}
        okButtonProps={{
          style: { backgroundColor: '#be185d', borderColor: '#be185d', fontWeight: 700 },
          disabled: !selectedPatient || lineItems.length === 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>

          {/* Step 1: Choose Patient */}
          {/* Step 1: Choose Patient */}
          <Card
            size="small"
            title={
              <Space>
                <User size={15} color="#be185d" />
                <span style={{ fontWeight: 700 }}>1. اختيار العميلة / الحالة</span>
              </Space>
            }
            style={{ borderRadius: 10, border: '1px solid #fbcfe8' }}
          >
            <Select
              showSearch
              allowClear
              style={{ width: '100%' }}
              placeholder="🔍 ابحثي بالاسم أو رقم التليفون (مثال: سلمى / 010...)"
              filterOption={(input, option: any) => {
                const p: RegisteredPatient = option?.data;
                if (!p) return false;
                const q = input.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.phone.includes(q) ||
                  p.patientNumber.toLowerCase().includes(q)
                );
              }}
              value={selectedPatient ? selectedPatient.id : undefined}
              onChange={(_val, opt: any) => {
                handleSelectPatient(opt?.data || null);
              }}
              options={registeredPatients.map((p) => ({
                value: p.id,
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>📞 {p.phone}</span>
                    </div>
                    <Tag color="magenta" style={{ fontSize: 11, margin: 0 }}>{p.patientNumber}</Tag>
                  </div>
                ),
                data: p,
              }))}
            />
            {selectedPatient && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircle2 size={14} />}
                message={
                  <span>
                    تم اختيار: <strong>{selectedPatient.name}</strong> ({selectedPatient.patientNumber}) — 📞 {selectedPatient.phone}
                  </span>
                }
                style={{ marginTop: 8, padding: '4px 12px', fontSize: 12, borderRadius: 8 }}
              />
            )}

            {/* Warn if patient has an appointment today and allow 1-click import */}
            {matchedAppointment && (
              <Alert
                type="info"
                showIcon
                message={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span>📌 <strong>الحالة لديها موعد محجوز اليوم:</strong> </span>
                      <Tag color="purple">{matchedAppointment.serviceName || matchedAppointment.serviceCategory}</Tag>
                      <span>مع <strong>{matchedAppointment.doctor}</strong> الساعة <strong>{matchedAppointment.time}</strong></span>
                      <span style={{ marginInlineStart: 8, color: '#be185d', fontWeight: 700 }}>({(matchedAppointment.priceEgp || 0).toLocaleString()} ج.م)</span>
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', fontWeight: 700 }}
                      onClick={() => {
                        const apptSrvName = matchedAppointment.serviceName || matchedAppointment.serviceCategory;
                        const apptPrice = matchedAppointment.priceEgp || 0;
                        setLineItems([
                          ...lineItems,
                          {
                            serviceId: `appt-${matchedAppointment.id}`,
                            serviceName: apptSrvName,
                            unitPrice: apptPrice,
                            quantity: 1,
                            lineTotal: apptPrice,
                          },
                        ]);
                        message.success('تم استيراد خدمة الموعد المحجوز للفاتورة بنجاح!');
                      }}
                    >
                      استيراد خدمة الموعد للفاتورة
                    </Button>
                  </div>
                }
                style={{ marginTop: 8, borderRadius: 8, border: '1px solid #99f6e4', backgroundColor: '#f0fdfa' }}
              />
            )}
          </Card>

          {/* Step 2: Add Packages & Services */}
          <Card
            size="small"
            title={
              <Space>
                <ShoppingCart size={15} color="#0d9488" />
                <span style={{ fontWeight: 700 }}>2. إضافة باقات وعروض العيادة أو خدمات فردية للفاتورة</span>
              </Space>
            }
            style={{ borderRadius: 10, border: '1px solid #ccfbf1' }}
          >
            {/* Packages Selector */}
            <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fdf2f8', borderRadius: 8, border: '1px solid #fbcfe8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ticket size={14} color="#be185d" />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#be185d' }}>🎁 اختيار باقة جلسات مسعرة من دليل الباقات:</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select
                  showSearch
                  style={{ flex: 1 }}
                  placeholder="اختاري من باقات العيادة المعتمدة..."
                  value={selectedPackageId}
                  onChange={(val) => setSelectedPackageId(val)}
                  options={clinicPackages.map((pkg) => ({
                    value: pkg.id,
                    label: `${pkg.name} — (${pkg.totalSessions} جلسات بـ ${pkg.priceEgp.toLocaleString()} ج.م)`,
                  }))}
                />
                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  style={{ backgroundColor: '#be185d', borderColor: '#be185d', fontWeight: 700 }}
                  onClick={() => selectedPackageId && addPackageToInvoice(selectedPackageId)}
                  disabled={!selectedPackageId}
                >
                  إضافة الباقة
                </Button>
              </div>
            </div>

            {/* Individual Services Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Select
                showSearch
                style={{ flex: 1 }}
                placeholder="🔍 أو اختر خدمة فردية من كتالوج العيادة المسعر..."
                value={selectedServiceId}
                onChange={(val) => setSelectedServiceId(val)}
                filterOption={(input, option: any) =>
                  option?.data?.name?.toLowerCase().includes(input.toLowerCase())
                }
                options={clinicServices.map((s) => ({
                  value: s.id,
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      <Tag color="cyan" style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>
                        {s.price.toLocaleString()} ج.م
                      </Tag>
                    </div>
                  ),
                  data: s,
                }))}
              />
              <Button
                type="primary"
                icon={<Plus size={15} />}
                style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', fontWeight: 700 }}
                onClick={() => selectedServiceId && addServiceToInvoice(selectedServiceId)}
                disabled={!selectedServiceId}
              >
                إضافة الخدمة
              </Button>
            </div>

            {/* Line Items Table */}
            {lineItems.length > 0 ? (
              <Table
                dataSource={lineItems}
                rowKey="serviceId"
                size="small"
                pagination={false}
                style={{ borderRadius: 8, overflow: 'hidden' }}
                columns={[
                  {
                    title: 'الخدمة',
                    dataIndex: 'serviceName',
                    key: 'name',
                    render: (name: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>,
                  },
                  {
                    title: 'سعر الوحدة',
                    dataIndex: 'unitPrice',
                    key: 'price',
                    width: 110,
                    render: (p: number) => (
                      <Tag color="magenta" style={{ fontWeight: 700 }}>{p.toLocaleString()} ج.م</Tag>
                    ),
                  },
                  {
                    title: 'الكمية',
                    key: 'qty',
                    width: 90,
                    render: (_: any, item: InvoiceLineItem) => (
                      <InputNumber
                        min={1}
                        max={20}
                        value={item.quantity}
                        size="small"
                        style={{ width: 70 }}
                        onChange={(val) => val && updateLineItemQty(item.serviceId, val)}
                      />
                    ),
                  },
                  {
                    title: 'الإجمالي',
                    key: 'total',
                    width: 110,
                    render: (_: any, item: InvoiceLineItem) => (
                      <Text strong style={{ color: '#be185d' }}>{item.lineTotal.toLocaleString()} ج.م</Text>
                    ),
                  },
                  {
                    title: '',
                    key: 'remove',
                    width: 40,
                    render: (_: any, item: InvoiceLineItem) => (
                      <Button
                        type="text"
                        size="small"
                        icon={<Trash2 size={14} color="#B91C1C" />}
                        onClick={() => removeLineItem(item.serviceId)}
                      />
                    ),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B', fontSize: 13 }}>
                لم تتم إضافة أي خدمة بعد — اختاري من القائمة واضغطي &quot;إضافة&quot;
              </div>
            )}
          </Card>

          {/* Step 3: Discount + Paid + Financial Summary */}
          <Card
            size="small"
            title={
              <Space>
                <DollarSign size={15} color="#be185d" />
                <span style={{ fontWeight: 700 }}>3. الخصم والدفع والملخص المالي</span>
              </Space>
            }
            style={{ borderRadius: 10, border: '1px solid #fbcfe8' }}
          >
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  خصم (ج.م) — اختياري:
                </Text>
                <InputNumber
                  min={0}
                  max={subtotal}
                  style={{ width: '100%' }}
                  value={discountAmount}
                  onChange={(v) => setDiscountAmount(v || 0)}
                  addonAfter="ج.م"
                  placeholder="0"
                />
              </Col>
              <Col span={12}>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  المبلغ المدفوع الآن (ج.م):
                </Text>
                <InputNumber
                  min={0}
                  max={finalTotal}
                  style={{ width: '100%' }}
                  value={paidNow}
                  onChange={(v) => setPaidNow(v || 0)}
                  addonAfter="ج.م"
                  placeholder="0"
                />
              </Col>
            </Row>

            <Divider style={{ margin: '10px 0' }} />

            {/* Financial Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#64748B' }}>المجموع قبل الخصم:</Text>
                <Text strong>{subtotal.toLocaleString()} ج.م</Text>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#047857' }}>🎁 الخصم المطبق:</Text>
                  <Text strong style={{ color: '#047857' }}>— {discountAmount.toLocaleString()} ج.م</Text>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #fbcfe8' }}>
                <Text strong style={{ fontSize: 15 }}>صافي الفاتورة:</Text>
                <Text strong style={{ fontSize: 18, color: '#be185d' }}>{finalTotal.toLocaleString()} ج.م</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#047857' }}>المدفوع الآن:</Text>
                <Text strong style={{ color: '#047857' }}>{paidNow.toLocaleString()} ج.م</Text>
              </div>
              {remaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#B91C1C', fontWeight: 600 }}>المتبقي (مدين):</Text>
                  <Text strong style={{ color: '#B91C1C', fontSize: 15 }}>{remaining.toLocaleString()} ج.م</Text>
                </div>
              )}
              {remaining === 0 && finalTotal > 0 && (
                <div style={{ textAlign: 'center', color: '#047857', fontWeight: 700, fontSize: 14 }}>
                  ✅ تم السداد بالكامل
                </div>
              )}
            </div>
          </Card>

          {/* Step 4: Dispatch to Doctor / Queue */}
          <Card
            size="small"
            title={
              <Space>
                <Send size={15} color="#be185d" />
                <span style={{ fontWeight: 700 }}>4. إرسال فوري لغرفة الكشف وطابور الطبيبة (Queue Dispatch)</span>
              </Space>
            }
            style={{ borderRadius: 10, border: '1.5px solid #BE123C', background: '#fff1f2' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 13, color: '#9f1239' }}>
                    إدراج الحالة فوراً في شاشة الطبيبة اليوم:
                  </Text>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    تسمع عند الدكتورة بالاسم، الخدمة، وحالة الدفع مباشرة دون الحاجة لشرح المريضة.
                  </div>
                </div>
                <Select
                  value={sendToDoctorNow ? 'yes' : 'no'}
                  onChange={(v) => setSendToDoctorNow(v === 'yes')}
                  options={[
                    { value: 'yes', label: '✓ نعم، إرسال فوري للطابور' },
                    { value: 'no', label: 'لا، حفظ فاتورة فقط' },
                  ]}
                  style={{ width: 180 }}
                />
              </div>

              {sendToDoctorNow && (
                <Row gutter={12} style={{ marginTop: 6, background: '#fff', padding: 10, borderRadius: 8, border: '1px solid #fecdd3' }}>
                  <Col span={8}>
                    <Text style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>وقت الموعد / الحضور:</Text>
                    <Select
                      value={scheduledQueueTime}
                      onChange={(v) => setScheduledQueueTime(v)}
                      style={{ width: '100%' }}
                      options={[
                        { value: dayjs().format('hh:mm A'), label: `الآن (${dayjs().format('hh:mm A')})` },
                        { value: '03:00 PM', label: '03:00 PM' },
                        { value: '03:30 PM', label: '03:30 PM' },
                        { value: '04:00 PM', label: '04:00 PM' },
                        { value: '04:30 PM', label: '04:30 PM' },
                        { value: '05:00 PM', label: '05:00 PM' },
                      ]}
                    />
                  </Col>
                  <Col span={8}>
                    <Text style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>رقم الجلسة الحالية:</Text>
                    <InputNumber
                      min={1}
                      max={20}
                      value={packageSessionNum}
                      onChange={(v) => setPackageSessionNum(v || 1)}
                      style={{ width: '100%' }}
                      prefix="جلسة #"
                    />
                  </Col>
                  <Col span={8}>
                    <Text style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>إجمالي جلسات الباكدج:</Text>
                    <InputNumber
                      min={1}
                      max={20}
                      value={packageTotalCount}
                      onChange={(v) => setPackageTotalCount(v || 4)}
                      style={{ width: '100%' }}
                      prefix="من إجمالي"
                    />
                  </Col>
                </Row>
              )}
            </div>
          </Card>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={<Space><CreditCard size={15} /><span style={{ fontWeight: 700 }}>تسجيل دفعة جديدة</span></Space>}
        open={!!payModalId}
        onCancel={() => setPayModalId(null)}
        onOk={() => payForm.submit()}
        okText="✅ تسجيل الدفعة"
        cancelText="إلغاء"
        okButtonProps={{ style: { backgroundColor: '#047857', borderColor: '#047857', fontWeight: 700 } }}
      >
        <Form form={payForm} layout="vertical" onFinish={handleRecordPayment} style={{ marginTop: 12 }}>
          {payModalId && (() => {
            const inv = invoices.find((i) => i.id === payModalId);
            const rem = inv ? Number(inv.total) - Number(inv.paidAmount) : 0;
            return (
              <Alert
                type="info"
                showIcon
                message={`المبلغ المتبقي على الفاتورة: ${rem.toLocaleString()} ${currency}`}
                style={{ marginBottom: 12, borderRadius: 8 }}
              />
            );
          })()}
          <Form.Item name="amount" label="مبلغ الدفعة (ج.م)" rules={[{ required: true, message: 'برجاء إدخال المبلغ' }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="ج.م" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="طريقة الدفع" initialValue="cash">
            <Select
              options={[
                { value: 'cash', label: '💵 كاش / نقداً' },
                { value: 'card', label: '💳 بطاقة ائتمان / فيزا' },
                { value: 'transfer', label: '📱 تحويل بنكي / إنستابي' },
                { value: 'installment', label: '📅 قسط شهري' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
