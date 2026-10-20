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
  User,
  Trash2,
  Edit3,
  Bath,
  CheckCircle2,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import { QueueBanner } from '../../components/QueueBanner';
import { QueueEntry, finishQueueSessionByPatient } from '../../lib/clinicQueue';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';
import { useLang } from '../../lib/useLang';
import { consumeInventoryStock } from '../../lib/clinicInventory';
import { recordDoctorSessionEarning } from '../../lib/doctorEarnings';

const { Title, Text } = Typography;

export interface SpaService {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'حمام ملكي ومغربي' | 'مساج استرخائي' | 'مساج علاجي' | 'عناية خاصة';
  durationMin: number;
  priceEgp: number;
  roomName: string;
  therapist: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface SpaSession {
  id: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  category: string;
  roomName: string;
  therapist: string;
  notes: string;
  date: string;
}

const INITIAL_SPA_SERVICES: SpaService[] = [
  {
    id: 'spa-1',
    nameAr: 'حمام مغربي ملكي بالأعشاب والطفل المغربي',
    nameEn: 'Royal Moroccan Herbal Bath',
    category: 'حمام ملكي ومغربي',
    durationMin: 60,
    priceEgp: 950,
    roomName: 'جناح الحمام المغربي 1',
    therapist: 'فاطمة الزهراء',
    description: 'بخار، صابون بلدي أصلي، تكييس كامل بالليفة المغربية، وماسك طفل بركاني لتوحيد اللون والنعومة.',
    status: 'active',
  },
  {
    id: 'spa-2',
    nameAr: 'حمام تركي برغوة الصابون وزيت الغار',
    nameEn: 'Turkish Foam Bath & Laurel Oil',
    category: 'حمام ملكي ومغربي',
    durationMin: 50,
    priceEgp: 850,
    roomName: 'جناح الحمام المغربي 2',
    therapist: 'سميرة',
    description: 'جلسة تدليك برغوة الصابون العطري على الرخام الدافئ مع حمام زيت مرطب.',
    status: 'active',
  },
  {
    id: 'spa-3',
    nameAr: 'مساج سويدي لكامل الجسم (Swedish Massage)',
    nameEn: 'Full Body Swedish Massage',
    category: 'مساج استرخائي',
    durationMin: 60,
    priceEgp: 700,
    roomName: 'غرفة المساج والهدوء (Lotus)',
    therapist: 'مريم الصاوي',
    description: 'مساج استرخائي بحركات انسيابية لتخفيف التوتر والإجهاد وتحسين الدورة الدموية بزيوت طبيعية.',
    status: 'active',
  },
  {
    id: 'spa-4',
    nameAr: 'مساج الأحجار البركانية الساخنة (Hot Stone)',
    nameEn: 'Hot Stone Volcanic Therapy',
    category: 'مساج علاجي',
    durationMin: 75,
    priceEgp: 1100,
    roomName: 'غرفة المساج (Orchid)',
    therapist: 'مريم الصاوي',
    description: 'علاج حراري بأحجار البازلت البركانية لتفكيك العقد العضلية وتخفيف آلام الظهر والكتفين.',
    status: 'active',
  },
  {
    id: 'spa-5',
    nameAr: 'مساج الأنسجة العميقة (Deep Tissue Massage)',
    nameEn: 'Deep Tissue Recovery Massage',
    category: 'مساج علاجي',
    durationMin: 60,
    priceEgp: 850,
    roomName: 'غرفة المساج (Jasmine)',
    therapist: 'نادية جاد',
    description: 'ضغط عميق لعلاج التقلصات العضلية وإعادة استرخاء الأربطة والأوتار المشدودة.',
    status: 'active',
  },
];

const LS_KEY = 'beauty_clinic_spa_services';
const LS_SESSIONS_KEY = 'clinic_spa_sessions_v1';

function loadSpaServices(): SpaService[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return INITIAL_SPA_SERVICES;
}

function loadSpaSessions(): SpaSession[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function SpaMassageView() {
  const { tx } = useLang();
  const [activeTab, setActiveTab] = useState<'sessions' | 'services'>('sessions');
  const [services, setServices] = useState<SpaService[]>(loadSpaServices);
  const [sessions, setSessions] = useState<SpaSession[]>(loadSpaSessions);

  // Registered patients
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<SpaService | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Forms
  const [serviceForm] = Form.useForm();
  const [sessionForm] = Form.useForm();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const saveServices = (next: SpaService[]) => {
    setServices(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const saveSessions = (next: SpaSession[]) => {
    setSessions(next);
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(next));
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    serviceForm.resetFields();
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (record: SpaService) => {
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
      message.success(tx('تم تعديل خدمة السبا بنجاح', 'Service updated'));
    } else {
      const newService: SpaService = {
        id: `spa-${Date.now()}`,
        nameAr: values.nameAr,
        nameEn: values.nameEn || values.nameAr,
        category: values.category,
        durationMin: values.durationMin,
        priceEgp: values.priceEgp,
        roomName: values.roomName || 'جناح السبا الرئيسي',
        therapist: values.therapist || 'أخصائية السبا',
        description: values.description || '',
        status: 'active',
      };
      saveServices([newService, ...services]);
      message.success(tx('تمت إضافة خدمة السبا بنجاح', 'Service added'));
    }
    setIsServiceModalOpen(false);
    serviceForm.resetFields();
  };

  // Save session and sync with queue
  const handleSaveSession = (values: any) => {
    const newSession: SpaSession = {
      id: `spas-${Date.now()}`,
      patientName: values.patientName,
      patientPhone: values.patientPhone || '',
      serviceName: values.serviceName,
      category: values.category || 'حمام ملكي ومغربي',
      roomName: values.roomName || 'جناح الحمام المغربي 1',
      therapist: values.therapist || 'أخصائية المساج والسبا',
      notes: values.notes || 'جلسة استرخاء ممتازة.',
      date: dayjs().format('YYYY-MM-DD HH:mm'),
    };

    saveSessions([newSession, ...sessions]);

    // 1. Deduct spa consumables from inventory (idempotent with session ID)
    if (newSession.category.includes('حمام') || newSession.serviceName.includes('حمام')) {
      consumeInventoryStock('صابون بلدي مغربي', 1, values.patientName, newSession.id, 'جلسة حمام مغربي');
    } else {
      consumeInventoryStock('زيوت مساج عضوية', 1, values.patientName, newSession.id, 'جلسة مساج استرخائي');
    }

    // 2. Automatically record Practitioner Commission / Earning (idempotent)
    recordDoctorSessionEarning({
      sessionRefId: newSession.id,
      doctorName: newSession.therapist,
      patientName: newSession.patientName,
      serviceName: newSession.serviceName,
      serviceCategory: 'سبا ومساج',
      servicePriceEgp: 850,
      notes: newSession.category,
    });

    // 3. Automatically complete in clinic daily queue
    finishQueueSessionByPatient(values.patientName, values.notes);

    message.success(
      tx(
        `✅ تم توثيق جلسة السبا، واحتساب مستحقات الأخصائية، وخصم المستلزمات للحالة: ${newSession.patientName}!`,
        `Saved spa session, credited commission, deducted inventory for ${newSession.patientName}!`
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
      title: tx('الخدمة والطقس الاسترخائي', 'Service'),
      key: 'name',
      render: (_: any, r: SpaService) => (
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
      title: tx('التصنيف', 'Category'),
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (cat: string) => (
        <Tag color={cat.includes('حمام') ? 'magenta' : cat.includes('علاجي') ? 'blue' : 'purple'}>
          {cat}
        </Tag>
      ),
    },
    {
      title: tx('المدة والأسعار', 'Duration & Fee'),
      key: 'price',
      width: 160,
      render: (_: any, r: SpaService) => (
        <div>
          <div style={{ fontWeight: 700, color: '#be185d', fontSize: 15 }}>
            {r.priceEgp.toLocaleString()} ج.م
          </div>
          <Text style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {r.durationMin} دقيقة
          </Text>
        </div>
      ),
    },
    {
      title: tx('الجناح والأخصائية', 'Room & Therapist'),
      key: 'room',
      width: 180,
      render: (_: any, r: SpaService) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 500, color: '#334155' }}>{r.roomName}</div>
          <div style={{ color: '#64748B', marginTop: 2 }}>
            <User size={11} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
            {r.therapist}
          </div>
        </div>
      ),
    },
    {
      title: tx('إجراءات', 'Actions'),
      key: 'actions',
      width: 110,
      render: (_: any, r: SpaService) => (
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
      render: (d: string) => <Tag color="purple">{d}</Tag>,
    },
    {
      title: tx('الحالة والعميلة', 'Patient'),
      key: 'patient',
      render: (_: any, r: SpaSession) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.patientPhone}</Text>
        </div>
      ),
    },
    {
      title: tx('الخدمة والطقس', 'Service'),
      key: 'service',
      render: (_: any, r: SpaSession) => (
        <div>
          <div style={{ fontWeight: 600, color: '#701a75' }}>{r.serviceName}</div>
          <Tag color="magenta" style={{ fontSize: 11, marginTop: 2 }}>{r.roomName}</Tag>
        </div>
      ),
    },
    {
      title: tx('الأخصائية', 'Therapist'),
      dataIndex: 'therapist',
      key: 'therapist',
      render: (t: string) => <span style={{ fontSize: 12 }}>{t}</span>,
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
          background: 'linear-gradient(135deg, #701a75 0%, #a21caf 50%, #c026d3 100%)',
          borderRadius: 16,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(162, 28, 175, 0.2)',
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
                <Bath size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {tx('منظومة السبا والمساج والحمام المغربي (Spa & Relaxation)', 'Spa & Relaxation Workspace')}
                </Title>
                <Text style={{ color: '#f5d0fe', fontSize: 13 }}>
                  {tx(
                    'إدارة غرف الحمام المغربي، المساج الاسترخائي والعلاجي، مع طابور مباشر متزامن مع الخزينة',
                    'Manage Moroccan bath rituals, therapeutic massages with live cashier-synchronized queue'
                  )}
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'left' }}>
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              style={{
                backgroundColor: '#ffffff',
                color: '#86198f',
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
              {tx('+ تسجيل جلسة سبا جديدة', '+ Log Spa Session')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Delay-Tolerant Synchronized Queue Banner */}
      <QueueBanner
        workspaceCategory="spa"
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
                  <CheckCircle2 size={15} color="#a21caf" />
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
                  <BookOpen size={15} color="#701a75" />
                  <span style={{ fontWeight: 600 }}>
                    {tx(`كتالوج خدمات السبا (${services.length})`, `Spa Catalog (${services.length})`)}
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
            style={{ fontWeight: 600, borderColor: '#a21caf', color: '#a21caf' }}
          >
            {tx('+ إضافة خدمة سبا للكتالوج', '+ Add Spa Service')}
          </Button>
        )}
      </div>

      {activeTab === 'sessions' ? (
        <Card
          style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
          bodyStyle={{ padding: 0 }}
          title={
            <Space>
              <CheckCircle2 size={16} color="#701a75" />
              <span style={{ fontWeight: 700 }}>
                {tx('سجل جلسات السبا والمساج المكتملة', 'Completed Spa & Massage Sessions Log')}
              </span>
            </Space>
          }
        >
          <Table
            dataSource={sessions}
            rowKey="id"
            columns={sessionColumns}
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: tx('لم يتم تسجيل أي جلسات سبا اليوم بعد — عند بدء الجلسة ستظهر هنا', 'No sessions logged yet') }}
          />
        </Card>
      ) : (
        <Card
          style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
          bodyStyle={{ padding: 0 }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Space>
                <Sparkles size={16} color="#a21caf" />
                <span style={{ fontWeight: 600 }}>
                  {tx('قائمة خدمات السبا المتاحة بالعيادة', 'Spa & Massage Services Catalog')}
                </span>
              </Space>
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 190 }}
                options={[
                  { value: 'all', label: 'جميع التصنيفات' },
                  { value: 'حمام ملكي ومغربي', label: 'حمام ملكي ومغربي' },
                  { value: 'مساج استرخائي', label: 'مساج استرخائي' },
                  { value: 'مساج علاجي', label: 'مساج علاجي' },
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

      {/* Modal: Log New Spa Session */}
      <Modal
        title={
          <Space>
            <UserCheck size={18} color="#701a75" />
            <span style={{ fontWeight: 700 }}>{tx('توثيق جلسة سبا ومساج جديدة', 'Log Spa Session')}</span>
          </Space>
        }
        open={isSessionModalOpen}
        onCancel={() => { setIsSessionModalOpen(false); sessionForm.resetFields(); }}
        onOk={() => sessionForm.submit()}
        okText={tx('حفظ الجلسة وإنهاؤها في الطابور ✓', 'Save Session & Complete in Queue')}
        cancelText={tx('إلغاء', 'Cancel')}
        okButtonProps={{ style: { backgroundColor: '#701a75', borderColor: '#701a75', fontWeight: 700 } }}
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
              <Form.Item name="serviceName" label={tx('نوع الجلسة / الطقس', 'Service Name')} rules={[{ required: true, message: 'مطلوب' }]} initialValue="حمام مغربي ملكي بالأعشاب والطفل المغربي">
                <Select
                  options={services.map((s) => ({
                    value: s.nameAr,
                    label: `${s.nameAr} (${s.priceEgp} ج.م)`,
                  }))}
                  onChange={(val) => {
                    const found = services.find((s) => s.nameAr === val);
                    if (found) {
                      sessionForm.setFieldsValue({
                        roomName: found.roomName,
                        therapist: found.therapist,
                      });
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="roomName" label={tx('الجناح / الغرفة', 'Room')} initialValue="جناح الحمام المغربي 1">
                <Input placeholder="مثال: جناح الحمام 1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="therapist" label={tx('الأخصائية / المدلكة', 'Therapist')} initialValue="أخصائية السبا">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label={tx('ملاحظات الجلسة والزيوت المستخدمة', 'Notes')}>
                <Input placeholder="زيوت لافندر، صابون بلدي أصلي..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal: Add/Edit Spa Service */}
      <Modal
        title={editingService ? tx('تعديل خدمة السبا', 'Edit Spa Service') : tx('إضافة خدمة سبا / مساج جديدة للكتالوج', 'Add Spa Service')}
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
                <Input placeholder="مثال: حمام مغربي ملكي بالأعشاب" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="nameEn" label={tx('الاسم بالإنجليزية (اختياري)', 'Name (English)')}>
                <Input placeholder="e.g. Royal Moroccan Bath" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label={tx('التصنيف', 'Category')} initialValue="حمام ملكي ومغربي" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'حمام ملكي ومغربي', label: 'حمام ملكي ومغربي' },
                    { value: 'مساج استرخائي', label: 'مساج استرخائي' },
                    { value: 'مساج علاجي', label: 'مساج علاجي' },
                    { value: 'عناية خاصة', label: 'عناية خاصة واستجمام' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="durationMin" label={tx('المدة (دقيقة)', 'Duration (min)')} initialValue={60} rules={[{ required: true }]}>
                <InputNumber min={15} max={180} step={15} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="priceEgp" label={tx('السعر (ج.م)', 'Price (EGP)')} rules={[{ required: true, message: 'حدد السعر' }]}>
                <InputNumber min={0} step={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="roomName" label={tx('الجناح / الغرفة المخصصة', 'Room')} initialValue="جناح الحمام المغربي 1">
                <Input placeholder="مثال: جناح الحمام 1 / غرفة اللافندر" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="therapist" label={tx('الأخصائية المسؤولة', 'Therapist')}>
                <Input placeholder="اسم المدلكة / الأخصائية" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={tx('وصف خطوات الجلسة والمنتجات المستخدمة', 'Description')}>
            <Input.TextArea rows={3} placeholder="اكتبي تفاصيل الطمي، الصابون المغربي، الزيوت العطرية أو طريقة المساج..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
