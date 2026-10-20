import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Segmented,
} from 'antd';
import {
  Sparkles,
  Plus,
  Clock,
  Trash2,
  Edit3,
  HeartHandshake,
  UserCheck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import dayjs from 'dayjs';
import { QueueBanner } from '../../components/QueueBanner';
import { QueueEntry, finishQueueSessionByPatient } from '../../lib/clinicQueue';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';
import { useLang } from '../../lib/useLang';
import { consumeInventoryStock } from '../../lib/clinicInventory';
import { recordDoctorSessionEarning } from '../../lib/doctorEarnings';

const { Title, Text } = Typography;

export interface BodyCareService {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'سكراب وتقشير جسم' | 'تفتيح وتوحيد لون' | 'علاج السيلوليت وشد الترهلات' | 'ترطيب عميق وتغذية';
  targetAreas: string;
  durationMin: number;
  priceEgp: number;
  productsUsed: string;
  description: string;
}

export interface BodyCareSession {
  id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  category: string;
  targetAreas: string;
  productsUsed: string;
  practitioner: string;
  notes: string;
  date: string;
}

const INITIAL_BODYCARE_SERVICES: BodyCareService[] = [
  {
    id: 'bc-1',
    nameAr: 'سكراب القهوة العضوية وزبدة الشيا لنعومة الجسم',
    nameEn: 'Organic Coffee & Shea Butter Body Polish',
    category: 'سكراب وتقشير جسم',
    targetAreas: 'كامل الجسم',
    durationMin: 45,
    priceEgp: 550,
    productsUsed: 'حبيبات بن عضوي، زيت اللوز الحلو، زبدة شيا نقية',
    description: 'تقشير الخلايا الميتة، تحفيز الكولاجين، ومنح البشرة ملمساً حريرياً ورائحة قهوة منعشة.',
  },
  {
    id: 'bc-2',
    nameAr: 'تقشير وتفتيح الركب والأكواع بالأحماض اللطيفة',
    nameEn: 'Knees & Elbows Chemical Peeling & Brightening',
    category: 'تفتيح وتوحيد لون',
    targetAreas: 'الركب والأكواع',
    durationMin: 30,
    priceEgp: 450,
    productsUsed: 'حمض لاكتيك + حمض جليكوليك مخفف + ماسك ترطيب تفتيحي',
    description: 'إزالة التصبغات الداكنة من المفاصل مع كريمات تفتيح مهدئة.',
  },
  {
    id: 'bc-3',
    nameAr: 'سكراب ملح الحليب واللافندر للجسم الحساس',
    nameEn: 'Milk Salt & Lavender Soothing Scrub',
    category: 'سكراب وتقشير جسم',
    targetAreas: 'كامل الجسم',
    durationMin: 40,
    priceEgp: 500,
    productsUsed: 'أملاح البحر الميت، بروتينات الحليب، زيت لافندر نقي',
    description: 'سنفرة لطيفة جداً لا تسبب احمراراً، ممتازة لتنقية المسام وتنعيم جلد الوزة (Keratosis Pilaris).',
  },
  {
    id: 'bc-4',
    nameAr: 'جلسة علاج السيلوليت والتدليك التصريفي اللمفاوي',
    nameEn: 'Anti-Cellulite Lymphatic Drainage Ritual',
    category: 'علاج السيلوليت وشد الترهلات',
    targetAreas: 'الأفخاذ والمؤخرة والبطن',
    durationMin: 50,
    priceEgp: 800,
    productsUsed: 'سيروم كافيين مركز، زيوت حارقة للدهون السطحية، كريم شد',
    description: 'تدليك يدوي متخصص وكاسات لتحسين تصريف السوائل المحتبسة وتمليس سطح الجلد.',
  },
  {
    id: 'bc-5',
    nameAr: 'بروتوكول تفتيح المناطق الحساسة (Bikini & Underarm Glow)',
    nameEn: 'Intimate Area Gentle Brightening Protocol',
    category: 'تفتيح وتوحيد لون',
    targetAreas: 'البكيني وتحت الإبط',
    durationMin: 35,
    priceEgp: 650,
    productsUsed: 'مقشر أحماض فواكه مخصص للأماكن الحساسة + مصل فيتامين C',
    description: 'جلسة تفتيح آمنة بدون تقشير خشن مع واقي من التهيج وعلاج اسمرار الاحتكاك.',
  },
  {
    id: 'bc-6',
    nameAr: 'ماسك الطين الوردي والترطيب العميق بكولاجين الجسم',
    nameEn: 'Pink Clay Deep Hydration Body Wrap',
    category: 'ترطيب عميق وتغذية',
    targetAreas: 'كامل الجسم والظهر',
    durationMin: 50,
    priceEgp: 650,
    productsUsed: 'طين وردي فرنسي، زيت الأرجان المغربي، كولاجين سائل',
    description: 'تغذية فائقة للبشرة الجافة والباهتة تعيد النضارة والإشراق لكامل مساحة الجسم.',
  },
];

const LS_KEY = 'beauty_clinic_bodycare_services';
const LS_SESSIONS_KEY = 'clinic_bodycare_sessions_v1';

function loadBodyCareServices(): BodyCareService[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return INITIAL_BODYCARE_SERVICES;
}

function loadBodyCareSessions(): BodyCareSession[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function BodyCareView() {
  const { tx } = useLang();
  const [activeTab, setActiveTab] = useState<'sessions' | 'services'>('sessions');
  const [services, setServices] = useState<BodyCareService[]>(loadBodyCareServices);
  const [sessions, setSessions] = useState<BodyCareSession[]>(loadBodyCareSessions);

  // Registered patients lookup
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BodyCareService | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Forms
  const [serviceForm] = Form.useForm();
  const [sessionForm] = Form.useForm();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const saveServices = (next: BodyCareService[]) => {
    setServices(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const saveSessions = (next: BodyCareSession[]) => {
    setSessions(next);
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(next));
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    serviceForm.resetFields();
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (record: BodyCareService) => {
    setEditingService(record);
    serviceForm.setFieldsValue(record);
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = (id: string) => {
    const next = services.filter((s) => s.id !== id);
    saveServices(next);
    message.success(tx('تم حذف الخدمة بنجاح', 'Service deleted'));
  };

  const handleServiceSubmit = (values: any) => {
    if (editingService) {
      const next = services.map((s) => (s.id === editingService.id ? { ...s, ...values } : s));
      saveServices(next);
      message.success(tx('تم تعديل الخدمة بنجاح', 'Service updated'));
    } else {
      const newService: BodyCareService = {
        id: `bc-${Date.now()}`,
        nameAr: values.nameAr,
        nameEn: values.nameEn || values.nameAr,
        category: values.category,
        targetAreas: values.targetAreas || 'كامل الجسم',
        durationMin: values.durationMin,
        priceEgp: values.priceEgp,
        productsUsed: values.productsUsed || '',
        description: values.description || '',
      };
      saveServices([newService, ...services]);
      message.success(tx('تمت إضافة خدمة العناية بالجسم بنجاح', 'Service added'));
    }
    setIsServiceModalOpen(false);
    serviceForm.resetFields();
  };

  // Save Body Care Session and sync with queue
  const handleSaveSession = (values: any) => {
    const newSession: BodyCareSession = {
      id: `bcs-${Date.now()}`,
      patientName: values.patientName,
      patientPhone: values.patientPhone || '',
      serviceName: values.serviceName,
      category: values.category || 'سكراب وتقشير جسم',
      targetAreas: values.targetAreas || 'كامل الجسم',
      productsUsed: values.productsUsed || '',
      practitioner: values.practitioner || 'أخصائية العناية بالجسم',
      notes: values.notes || 'جلسة عناية ممتازة دون أي تهيج للبشرة.',
      date: dayjs().format('YYYY-MM-DD HH:mm'),
    };

    saveSessions([newSession, ...sessions]);

    // 1. Deduct scrub product from inventory (idempotent with session ID)
    consumeInventoryStock('سكراب القهوة العضوية', 1, values.patientName, newSession.id, 'جلسة تقشير وعناية بالجسم');

    // 2. Automatically record Practitioner Commission / Earning (idempotent)
    recordDoctorSessionEarning({
      sessionRefId: newSession.id,
      doctorName: newSession.practitioner,
      patientName: newSession.patientName,
      serviceName: newSession.serviceName,
      serviceCategory: 'عناية بالجسم وسكراب',
      servicePriceEgp: 650,
      notes: newSession.targetAreas,
    });

    // 3. Automatically complete in clinic daily queue
    finishQueueSessionByPatient(values.patientName, values.notes);

    message.success(
      tx(
        `✅ تم توثيق جلسة العناية بالجسم، واحتساب مستحقات الأخصائية، وخصم المستلزمات للحالة: ${newSession.patientName}!`,
        `Saved body care session, credited commission, deducted inventory for ${newSession.patientName}!`
      )
    );
    setIsSessionModalOpen(false);
    sessionForm.resetFields();
  };

  const filtered = categoryFilter === 'all'
    ? services
    : services.filter((s) => s.category === categoryFilter);

  const serviceColumns = [
    {
      title: tx('الخدمة ونوع السكراب', 'Service & Scrub Type'),
      key: 'name',
      render: (_: any, r: BodyCareService) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{r.nameAr}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.nameEn}</Text>
          {r.description && (
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{r.description}</div>
          )}
        </div>
      ),
    },
    {
      title: tx('التصنيف والمنطقة', 'Category & Target Area'),
      key: 'category',
      width: 200,
      render: (_: any, r: BodyCareService) => (
        <div>
          <Tag color="cyan">{r.category}</Tag>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
            🎯 <strong>المستهدف:</strong> {r.targetAreas}
          </div>
        </div>
      ),
    },
    {
      title: tx('المكونات والمنتجات', 'Products Used'),
      dataIndex: 'productsUsed',
      key: 'products',
      width: 200,
      render: (p: string) => <span style={{ fontSize: 12, color: '#64748B' }}>{p || 'زيوت ومقشرات طبيعية'}</span>,
    },
    {
      title: tx('المدة والسعر', 'Duration & Fee'),
      key: 'price',
      width: 140,
      render: (_: any, r: BodyCareService) => (
        <div>
          <div style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
            {r.priceEgp.toLocaleString()} ج.م
          </div>
          <Text style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {r.durationMin} دقيقة
          </Text>
        </div>
      ),
    },
    {
      title: tx('إجراءات', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: any, r: BodyCareService) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<Edit3 size={14} />} onClick={() => handleOpenEditService(r)} />
          <Popconfirm title={tx('حذف هذه الخدمة؟', 'Delete service?')} onConfirm={() => handleDeleteService(r.id)} okText="نعم" cancelText="إلغاء">
            <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const sessionColumns = [
    {
      title: tx('التاريخ والوقت', 'Date & Time'),
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (d: string) => <Tag color="green">{d}</Tag>,
    },
    {
      title: tx('الحالة والعميلة', 'Patient'),
      key: 'patient',
      render: (_: any, r: BodyCareSession) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.patientPhone}</Text>
        </div>
      ),
    },
    {
      title: tx('الخدمة والمنطقة', 'Service & Area'),
      key: 'service',
      render: (_: any, r: BodyCareSession) => (
        <div>
          <div style={{ fontWeight: 600, color: '#047857' }}>{r.serviceName}</div>
          <Tag color="cyan" style={{ fontSize: 11, marginTop: 2 }}>{r.targetAreas}</Tag>
        </div>
      ),
    },
    {
      title: tx('المكونات المستخدمة', 'Products Used'),
      dataIndex: 'productsUsed',
      key: 'productsUsed',
      render: (p: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{p || 'زيوت وسكراب مخصص'}</span>,
    },
    {
      title: tx('الأخصائية', 'Practitioner'),
      dataIndex: 'practitioner',
      key: 'practitioner',
      render: (p: string) => <span style={{ fontSize: 12 }}>{p}</span>,
    },
    {
      title: tx('ملاحظات الجلسة', 'Notes'),
      dataIndex: 'notes',
      key: 'notes',
      render: (n: string) => <span style={{ fontSize: 12, color: '#475569' }}>{n}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Luxury Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
          borderRadius: 16,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(4, 120, 87, 0.2)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="center" size={14}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.22)',
                  borderRadius: 12,
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HeartHandshake size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {tx('منظومة العناية بالجسم وسنفرة البشرة (Body Care & Scrubs)', 'Body Care & Scrubs Workspace')}
                </Title>
                <Text style={{ color: '#d1fae5', fontSize: 13 }}>
                  {tx(
                    'إدارة ومتابعة طابور جلسات تقشير الجسم، سكراب القهوة، تفتيح الركب والأكواع، والمناطق الحساسة',
                    'Manage body scrub sessions, peeling, and brightening with synchronized queue'
                  )}
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'left' }}>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<Plus size={16} />}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#065f46',
                  borderColor: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                }}
                onClick={() => {
                  sessionForm.resetFields();
                  setIsSessionModalOpen(true);
                }}
              >
                {tx('+ تسجيل جلسة سكراب جديدة', '+ Log Body Care Session')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Delay-Tolerant Synchronized Queue Banner */}
      <QueueBanner
        workspaceCategory="bodycare"
        onSelectPatient={(q: QueueEntry) => {
          sessionForm.setFieldsValue({
            patientName: q.patientName,
            patientPhone: q.patientPhone,
            serviceName: q.serviceName,
            notes: q.packageName ? `${q.packageName} — جلسة ${q.packageSessionNumber || 1}` : q.serviceName,
          });
          setIsSessionModalOpen(true);
        }}
      />

      {/* Mode Switcher: Sessions History vs Services Catalog */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Segmented
          size="middle"
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'sessions' | 'services')}
          options={[
            {
              value: 'sessions',
              label: (
                <Space size={6}>
                  <CheckCircle2 size={15} color="#059669" />
                  <span style={{ fontWeight: 600 }}>
                    {tx(`سجل الجلسات المنفذة (${sessions.length})`, `Completed Sessions (${sessions.length})`)}
                  </span>
                </Space>
              ),
            },
            {
              value: 'services',
              label: (
                <Space size={6}>
                  <BookOpen size={15} color="#047857" />
                  <span style={{ fontWeight: 600 }}>
                    {tx(`كتالوج خدمات وسكراب الجسم (${services.length})`, `Services Catalog (${services.length})`)}
                  </span>
                </Space>
              ),
            },
          ]}
          style={{ background: '#e2e8f0', borderRadius: 8, padding: 3 }}
        />

        {activeTab === 'services' && (
          <Button
            type="dashed"
            icon={<Plus size={14} />}
            onClick={handleOpenAddService}
            style={{ fontWeight: 600, borderColor: '#047857', color: '#047857' }}
          >
            {tx('+ إضافة خدمة جديدة للكتالوج', '+ Add Service to Catalog')}
          </Button>
        )}
      </div>

      {activeTab === 'sessions' ? (
        <Card
          style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
          bodyStyle={{ padding: 0 }}
          title={
            <Space>
              <CheckCircle2 size={16} color="#047857" />
              <span style={{ fontWeight: 700 }}>
                {tx('سجل جلسات العناية بالجسم والسكراب المكتملة', 'Completed Body Care Sessions Log')}
              </span>
            </Space>
          }
        >
          <Table
            dataSource={sessions}
            rowKey="id"
            columns={sessionColumns}
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: tx('لم يتم تسجيل أي جلسات سكراب اليوم بعد — عند بدء الجلسة ستظهر هنا', 'No sessions logged yet') }}
          />
        </Card>
      ) : (
        <Card
          style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
          bodyStyle={{ padding: 0 }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Space>
                <Sparkles size={16} color="#047857" />
                <span style={{ fontWeight: 600 }}>
                  {tx('قائمة خدمات السكراب والعناية بالجسم المتاحة بالعيادة', 'Body Care & Scrub Catalog')}
                </span>
              </Space>
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 220 }}
                options={[
                  { value: 'all', label: 'جميع التصنيفات' },
                  { value: 'سكراب وتقشير جسم', label: 'سكراب وتقشير جسم' },
                  { value: 'تفتيح وتوحيد لون', label: 'تفتيح وتوحيد لون' },
                  { value: 'علاج السيلوليت وشد الترهلات', label: 'علاج السيلوليت وشد الترهلات' },
                  { value: 'ترطيب عميق وتغذية', label: 'ترطيب عميق وتغذية' },
                ]}
              />
            </div>
          }
        >
          <Table
            dataSource={filtered}
            rowKey="id"
            columns={serviceColumns}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 750 }}
          />
        </Card>
      )}

      {/* Modal: Log New Body Care Session */}
      <Modal
        title={
          <Space>
            <UserCheck size={18} color="#047857" />
            <span style={{ fontWeight: 700 }}>{tx('توثيق جلسة عناية وسكراب للجسم', 'Log Body Care Session')}</span>
          </Space>
        }
        open={isSessionModalOpen}
        onCancel={() => { setIsSessionModalOpen(false); sessionForm.resetFields(); }}
        onOk={() => sessionForm.submit()}
        okText={tx('حفظ الجلسة وإنهاؤها في الطابور ✓', 'Save Session & Complete in Queue')}
        cancelText={tx('إلغاء', 'Cancel')}
        okButtonProps={{ style: { backgroundColor: '#047857', borderColor: '#047857', fontWeight: 700 } }}
        width={650}
      >
        <Form form={sessionForm} layout="vertical" onFinish={handleSaveSession} style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="patientName" label={tx('اسم الحالة / العميلة', 'Patient Name')} rules={[{ required: true, message: 'مطلوب' }]}>
                <Select
                  showSearch
                  placeholder={tx('اختاري من الحالات المسجلة أو اكتبي الاسم', 'Select registered patient')}
                  options={registeredPatients.map((p) => ({
                    value: p.name,
                    label: `${p.name} (${p.patientNumber})`,
                  }))}
                  onChange={(val) => {
                    const found = registeredPatients.find((p) => p.name === val);
                    if (found) sessionForm.setFieldsValue({ patientPhone: found.phone });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="patientPhone" label={tx('رقم هاتف العميلة', 'Patient Phone')}>
                <Input placeholder="010..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="serviceName" label={tx('نوع الجلسة / السكراب', 'Service Name')} rules={[{ required: true, message: 'مطلوب' }]} initialValue="سكراب القهوة العضوية وزبدة الشيا">
                <Select
                  options={services.map((s) => ({
                    value: s.nameAr,
                    label: `${s.nameAr} (${s.priceEgp} ج.م)`,
                  }))}
                  onChange={(val) => {
                    const found = services.find((s) => s.nameAr === val);
                    if (found) {
                      sessionForm.setFieldsValue({
                        targetAreas: found.targetAreas,
                        productsUsed: found.productsUsed,
                      });
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="targetAreas" label={tx('المناطق المعالجة', 'Target Areas')} initialValue="كامل الجسم">
                <Input placeholder="مثال: كامل الجسم، الركب والأكواع..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="productsUsed" label={tx('المواد والزيوت المستخدمة', 'Products Used')}>
                <Input placeholder="مثال: قهوة عضوية، زيت لوز، أملاح البحر الميت..." />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="practitioner" label={tx('الأخصائية المنفذة', 'Practitioner')} initialValue="أخصائية العناية بالجسم">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label={tx('ملاحظات الجلسة وتوصيات ما بعد السكراب', 'Session Notes')}>
            <Input.TextArea rows={3} placeholder={tx('ملاحظات عن تجاوب الجلد، ترطيب إضافي، توصية بالترطيب المنزلي...', 'Clinical observations...')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Add/Edit Body Care Service in Catalog */}
      <Modal
        title={editingService ? tx('تعديل خدمة في الكتالوج', 'Edit Catalog Service') : tx('إضافة خدمة سكراب جديدة للكتالوج', 'Add Catalog Service')}
        open={isServiceModalOpen}
        onCancel={() => { setIsServiceModalOpen(false); serviceForm.resetFields(); }}
        onOk={() => serviceForm.submit()}
        okText={editingService ? tx('حفظ التعديلات', 'Save Changes') : tx('إضافة الخدمة', 'Add Service')}
        cancelText={tx('إلغاء', 'Cancel')}
        width={620}
      >
        <Form form={serviceForm} layout="vertical" onFinish={handleServiceSubmit}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="nameAr" label={tx('اسم الخدمة (بالعربي)', 'Service Name (Arabic)')} rules={[{ required: true, message: 'مطلوب' }]}>
                <Input placeholder="مثال: سكراب القهوة وزبدة الشيا" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="nameEn" label={tx('الاسم بالإنجليزية (اختياري)', 'Name (English)')}>
                <Input placeholder="e.g. Coffee Body Polish" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label={tx('التصنيف', 'Category')} initialValue="سكراب وتقشير جسم" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'سكراب وتقشير جسم', label: 'سكراب وتقشير جسم' },
                    { value: 'تفتيح وتوحيد لون', label: 'تفتيح وتوحيد لون' },
                    { value: 'علاج السيلوليت وشد الترهلات', label: 'علاج السيلوليت وشد الترهلات' },
                    { value: 'ترطيب عميق وتغذية', label: 'ترطيب عميق وتغذية' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetAreas" label={tx('المنطقة المستهدفة', 'Target Area')} initialValue="كامل الجسم">
                <Input placeholder="مثال: كامل الجسم / الركب والأكواع / البكيني" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="durationMin" label={tx('المدة (دقيقة)', 'Duration (min)')} initialValue={45} rules={[{ required: true }]}>
                <InputNumber min={15} max={180} step={15} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priceEgp" label={tx('السعر (ج.م)', 'Price (EGP)')} rules={[{ required: true, message: 'حدد السعر' }]}>
                <InputNumber min={0} step={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="productsUsed" label={tx('المكونات ومواد السكراب المستخدمة', 'Products Used')}>
            <Input placeholder="مثال: أملاح بحر ميت، زيت لوز، كافيين، طمي وردي..." />
          </Form.Item>

          <Form.Item name="description" label={tx('وصف الفوائد وطريقة التطبيق', 'Description')}>
            <Input.TextArea rows={3} placeholder="اكتبي شرحاً عن فوائد الجلسة وكيفية تطبيقها..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
