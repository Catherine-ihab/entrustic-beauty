import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Select,
  InputNumber,
  Input,
  Table,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
} from 'antd';
import {
  Zap,
  ShieldAlert,
  History,
  Gauge,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import dayjs from 'dayjs';
import { QueueBanner } from '../../components/QueueBanner';
import { QueueEntry, finishQueueSessionByPatient } from '../../lib/clinicQueue';
import { consumeInventoryStock } from '../../lib/clinicInventory';
import { recordDoctorSessionEarning } from '../../lib/doctorEarnings';
import { redeemPackageSessionForPatient } from '../../lib/packagesDirectory';

const { Title, Text } = Typography;

export interface LaserSession {
  id: string;
  sessionNumber: number;
  date: string;
  patientName: string;
  patientPhone: string;
  bodyArea: string;
  device: string;
  wavelength: string;
  spotSizeMm: number;
  fluenceJcm2: number;
  pulseWidthMs: number;
  pulsesCount: number;
  coolingSetting: string;
  sessionType: 'جلسة أساسية' | 'جلسة رتوش (Touch-up)' | 'جلسة ضمن باكدج';
  practitioner: string;
  notes: string;
}

const INITIAL_AREAS = [
  'كامل الجسم (Full Body)',
  'البكيني وتحت الإبط (Bikini & Underarms)',
  'الساقين كاملة (Full Legs)',
  'الذراعين كاملة (Full Arms)',
  'نصف الساقين (Lower Legs)',
  'الوجه والرقبة (Face & Neck)',
  'الشارب والذقن (Upper Lip & Chin)',
  'البطن والصدر (Chest & Abdomen)',
  'الظهر والكتفين (Back & Shoulders)',
];

const INITIAL_DEVICES = [
  'Candela GentleMax Pro Plus (755nm / 1064nm)',
  'Lumenis LightSheer Quattro (805nm Diode)',
  'Alma Soprano Titanium (Trio Alex/Diode/YAG)',
  'Cynosure Apogee Elite+',
  'Fotona SP Dynamis Nd:YAG',
];

const DEFAULT_SESSIONS: LaserSession[] = [
  {
    id: 'ls-01',
    sessionNumber: 3,
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    patientName: 'لينا الحسن',
    patientPhone: '01012345678',
    bodyArea: 'الساقين كاملة (Full Legs)',
    device: 'Candela GentleMax Pro Plus (755nm / 1064nm)',
    wavelength: '755nm Alexandrite',
    spotSizeMm: 18,
    fluenceJcm2: 14,
    pulseWidthMs: 3,
    pulsesCount: 1450,
    coolingSetting: 'DCD Cryogen 40/40',
    sessionType: 'جلسة ضمن باكدج',
    practitioner: 'د. سارة القاضي',
    notes: 'استجابة ممتازة، لا توجد أي حساسية أو احمرار مستمر. تم وضع واقي شمس وكريم مهدئ.',
  },
  {
    id: 'ls-02',
    sessionNumber: 5,
    date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    patientName: 'دينا مصطفى',
    patientPhone: '01098765432',
    bodyArea: 'البكيني وتحت الإبط (Bikini & Underarms)',
    device: 'Candela GentleMax Pro Plus (755nm / 1064nm)',
    wavelength: '1064nm Nd:YAG',
    spotSizeMm: 15,
    fluenceJcm2: 24,
    pulseWidthMs: 10,
    pulsesCount: 680,
    coolingSetting: 'DCD Cryogen 50/40',
    sessionType: 'جلسة ضمن باكدج',
    practitioner: 'أخصائية الليزر مريم',
    notes: 'انحسار واضح في كثافة الشعر، البصيلات أصبحت رفيعة جداً وخفيفة.',
  },
  {
    id: 'ls-03',
    sessionNumber: 1,
    date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    patientName: 'مايا نادر',
    patientPhone: '01223344556',
    bodyArea: 'الوجه والرقبة (Face & Neck)',
    device: 'Lumenis LightSheer Quattro (805nm Diode)',
    wavelength: '805nm Diode',
    spotSizeMm: 14,
    fluenceJcm2: 18,
    pulseWidthMs: 30,
    pulsesCount: 420,
    coolingSetting: 'ChillTip Contact 4°C',
    sessionType: 'جلسة أساسية',
    practitioner: 'د. سارة القاضي',
    notes: 'جلسة أولى افتتاحية، فحص حساسية مبدئي ناجح.',
  },
];

const LS_SESSIONS = 'laser_sessions_records_v2';
const LS_AREAS = 'laser_custom_areas_v2';
const LS_DEVICES = 'laser_custom_devices_v2';

export function LaserWorkspaceView() {
  const [sessions, setSessions] = useState<LaserSession[]>(() => {
    try {
      const raw = localStorage.getItem(LS_SESSIONS);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_SESSIONS;
  });

  const [areas, setAreas] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LS_AREAS);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return INITIAL_AREAS;
  });

  const [devices, setDevices] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LS_DEVICES);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return INITIAL_DEVICES;
  });

  // Selected for quick calibration panel
  const [selectedArea, setSelectedArea] = useState<string>(areas[0] || 'كامل الجسم');
  const [selectedDevice, setSelectedDevice] = useState<string>(devices[0] || 'Candela GentleMax Pro Plus');
  const [fluence, setFluence] = useState<number>(14);
  const [pulseDuration, setPulseDuration] = useState<number>(3);
  const [spotSize, setSpotSize] = useState<number>(18);
  const [shotCount, setShotCount] = useState<number>(1200);

  // Modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionForm] = Form.useForm();

  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');

  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  const saveSessions = (next: LaserSession[]) => {
    setSessions(next);
    localStorage.setItem(LS_SESSIONS, JSON.stringify(next));
    localStorage.setItem('laser_sessions_history_v2', JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const saveAreas = (next: string[]) => {
    setAreas(next);
    localStorage.setItem(LS_AREAS, JSON.stringify(next));
  };

  const saveDevices = (next: string[]) => {
    setDevices(next);
    localStorage.setItem(LS_DEVICES, JSON.stringify(next));
  };

  const handleAddNewArea = () => {
    if (!newAreaName.trim()) return;
    const next = [...areas, newAreaName.trim()];
    saveAreas(next);
    setSelectedArea(newAreaName.trim());
    setNewAreaName('');
    setIsAddAreaModalOpen(false);
    message.success('تمت إضافة منطقة الليزر بنجاح!');
  };

  const handleAddNewDevice = () => {
    if (!newDeviceName.trim()) return;
    const next = [...devices, newDeviceName.trim()];
    saveDevices(next);
    setSelectedDevice(newDeviceName.trim());
    setNewDeviceName('');
    setIsAddDeviceModalOpen(false);
    message.success('تمت إضافة جهاز الليزر الجديد للعيادة!');
  };

  const handleSaveSession = (values: any) => {
    const newSession: LaserSession = {
      id: `ls-${Date.now()}`,
      sessionNumber: (sessions.length > 0 ? sessions[0].sessionNumber : 0) + 1,
      date: dayjs().format('YYYY-MM-DD'),
      patientName: values.patientName,
      patientPhone: values.patientPhone || '',
      bodyArea: values.bodyArea || selectedArea,
      device: values.device || selectedDevice,
      wavelength: values.device?.includes('Diode') ? '805nm Diode' : values.device?.includes('YAG') ? '1064nm Nd:YAG' : '755nm Alexandrite',
      spotSizeMm: values.spotSizeMm || spotSize,
      fluenceJcm2: values.fluenceJcm2 || fluence,
      pulseWidthMs: values.pulseWidthMs || pulseDuration,
      pulsesCount: values.pulsesCount || shotCount,
      coolingSetting: values.coolingSetting || 'DCD Cryogen 40/40',
      sessionType: values.sessionType || 'جلسة ضمن باكدج',
      practitioner: values.practitioner || 'د. سارة القاضي',
      notes: values.notes || 'جلسة موفقة دون أي مضاعفات.',
    };

    saveSessions([newSession, ...sessions]);

    // 1. Deduct post-laser soothing cream from inventory (idempotent with session ID)
    consumeInventoryStock('كريم فيوسيكورت', 1, values.patientName, newSession.id, `جلسة ليزر: ${newSession.bodyArea}`);

    // 2. Automatically record Doctor Commission / Earning (idempotent)
    recordDoctorSessionEarning({
      sessionRefId: newSession.id,
      doctorName: newSession.practitioner,
      patientName: newSession.patientName,
      serviceName: `جلسة ليزر (${newSession.bodyArea})`,
      serviceCategory: 'ليزر وإزالة شعر',
      servicePriceEgp: Number(values.servicePriceEgp) || 1500,
      date: newSession.date,
      notes: `${newSession.device} — ${newSession.pulsesCount} نبضة`,
    });

    // 3. Deduct/Redeem package session credit if patient has active package enrollment
    const redeemRes = redeemPackageSessionForPatient(newSession.patientName, 'ليزر وإزالة شعر');
    if (redeemRes.success) {
      message.info(`🎟️ ${redeemRes.message}`);
    }

    // 4. Mark completed in daily queue
    finishQueueSessionByPatient(values.patientName, values.notes);

    message.success(`✅ تم تسجيل جلسة الليزر، واحتساب مستحقات الطبيبة، وتحديث الباقات والمخزن للحالة: ${newSession.patientName}`);
    setIsSessionModalOpen(false);
    sessionForm.resetFields();
  };

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    saveSessions(next);
    message.success('تم حذف السجل');
  };

  const columns = [
    {
      title: 'رقم الجلسة',
      dataIndex: 'sessionNumber',
      key: 'num',
      width: 90,
      render: (num: number) => <Tag color="#ec4899" style={{ fontWeight: 700 }}>#{num}</Tag>,
    },
    {
      title: 'الحالة والعميلة',
      key: 'patient',
      render: (_: any, r: LaserSession) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(r.date).format('YYYY/MM/DD')} {r.patientPhone && `• ${r.patientPhone}`}
          </Text>
        </div>
      ),
    },
    {
      title: 'المنطقة المعالجة',
      key: 'area',
      render: (_: any, r: LaserSession) => (
        <div>
          <div style={{ fontWeight: 600, color: '#be185d' }}>{r.bodyArea}</div>
          <Tag color="cyan" style={{ marginTop: 2 }}>{r.sessionType}</Tag>
        </div>
      ),
    },
    {
      title: 'الجهاز والإعدادات',
      key: 'device',
      render: (_: any, r: LaserSession) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 500 }}>{r.device}</div>
          <div style={{ color: '#475569', marginTop: 2 }}>
            <span style={{ fontWeight: 700, color: '#be185d' }}>{r.fluenceJcm2} J/cm²</span> • {r.pulseWidthMs} ms • سبوت {r.spotSizeMm} مم
          </div>
          <div style={{ color: '#64748B', fontSize: 11 }}>
            عداد الضربات: <strong>{r.pulsesCount} ضربة</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'الأخصائية والملاحظات',
      key: 'notes',
      render: (_: any, r: LaserSession) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 500, color: '#334155' }}>
            <User size={11} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
            {r.practitioner}
          </div>
          {r.notes && (
            <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{r.notes}</div>
          )}
        </div>
      ),
    },
    {
      title: 'حذف',
      key: 'actions',
      width: 70,
      render: (_: any, r: LaserSession) => (
        <Popconfirm title="حذف هذا السجل؟" onConfirm={() => handleDeleteSession(r.id)} okText="نعم" cancelText="إلغاء">
          <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Luxury Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #db2777 100%)',
          borderRadius: 16,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(190, 24, 93, 0.22)',
        }}
        bodyStyle={{ padding: '22px 28px' }}
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
                <Zap size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  منظومة جلسات الليزر وإزالة الشعر (Laser Hair Removal)
                </Title>
                <Text style={{ color: '#fce7f3', fontSize: 13 }}>
                  إدارة محطات الليزر (كانديلا، دايود)، ضبط طاقات الضربات والنبضات، تسجيل سريع وسلس للجلسات مع إمكانية إضافة مناطق وأجهزة مخصصة
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
                color: '#9d174d',
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
              + تسجيل جلسة ليزر جديدة
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Delay-Tolerant Synchronized Queue Banner */}
      <QueueBanner
        workspaceCategory="laser"
        onSelectPatient={(q: QueueEntry) => {
          sessionForm.setFieldsValue({
            patientName: q.patientName,
            patientPhone: q.patientPhone,
            sessionType: q.packageSessionNumber ? 'جلسة ضمن باكدج' : 'جلسة أساسية',
            notes: q.packageName
              ? `${q.packageName} — جلسة ${q.packageSessionNumber || 1} من ${q.packageTotalSessions || 4}`
              : q.serviceName,
          });
          setIsSessionModalOpen(true);
        }}
      />

      {/* Main Workspace Layout */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Quick Parameters & Custom Area/Device Config */}
        <Col xs={24} lg={9}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Calibration Card */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Gauge size={16} color="#be185d" />
                    <span style={{ fontWeight: 600 }}>إعدادات ومعايرة طاقة الليزر</span>
                  </Space>
                  <Button size="small" type="link" onClick={() => setIsAddAreaModalOpen(true)}>
                    + منطقة جديدة
                  </Button>
                </div>
              }
              style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    المنطقة المعالجة:
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={selectedArea}
                    onChange={setSelectedArea}
                    options={areas.map((a) => ({ value: a, label: a }))}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>جهاز الليزر بالعيادة:</Text>
                    <Button size="small" type="link" style={{ padding: 0 }} onClick={() => setIsAddDeviceModalOpen(true)}>
                      + جهاز جديد
                    </Button>
                  </div>
                  <Select
                    style={{ width: '100%' }}
                    value={selectedDevice}
                    onChange={setSelectedDevice}
                    options={devices.map((d) => ({ value: d, label: d }))}
                  />
                </div>

                <Row gutter={10}>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      الطاقة (Fluence):
                    </Text>
                    <InputNumber
                      min={6}
                      max={40}
                      value={fluence}
                      onChange={(v) => setFluence(v || 14)}
                      addonAfter="J/cm²"
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      عرض النبضة (Pulse):
                    </Text>
                    <InputNumber
                      min={0.5}
                      max={100}
                      value={pulseDuration}
                      onChange={(v) => setPulseDuration(v || 3)}
                      addonAfter="ms"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Row gutter={10}>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      قطر السبوت (Spot Size):
                    </Text>
                    <InputNumber
                      min={6}
                      max={26}
                      value={spotSize}
                      onChange={(v) => setSpotSize(v || 18)}
                      addonAfter="mm"
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      عدد الضربات (Shots):
                    </Text>
                    <InputNumber
                      min={50}
                      max={5000}
                      step={50}
                      value={shotCount}
                      onChange={(v) => setShotCount(v || 1000)}
                      addonAfter="ضربة"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>
            </Card>

            {/* Quick Safety Check */}
            <Card
              size="small"
              title={
                <Space>
                  <ShieldAlert size={16} color="#be185d" />
                  <span style={{ fontWeight: 600 }}>تنبيهات أمان الليزر السريعة</span>
                </Space>
              }
              style={{ borderRadius: 14, border: '1px solid #FFE4E6', backgroundColor: '#FFF5F7' }}
            >
              <div style={{ fontSize: 12, color: '#881337', lineHeight: 1.6 }}>
                <div>✔️ التأكد من حلاقة المنطقة بالموس قبل الجلسة بـ 24 ساعة.</div>
                <div>✔️ ارتداء نظارات حماية العين المعتمدة OD 7+ للأخصائية والحالة.</div>
                <div>✔️ تجنب التعرض المباشر للشمس أو استخدام مقشرات قبل الجلسة.</div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Right Column: Sessions Log Table */}
        <Col xs={24} lg={15}>
          <Card
            style={{ borderRadius: 14, border: '1px solid #E2E8F0' }}
            bodyStyle={{ padding: 0 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <History size={16} color="#be185d" />
                  <span style={{ fontWeight: 600 }}>سجل جلسات الليزر المنفذة بالعيادة</span>
                </Space>
                <Tag color="magenta">{sessions.length} جلسات مسجلة</Tag>
              </div>
            }
          >
            <Table
              dataSource={sessions}
              rowKey="id"
              columns={columns}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 750 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal: REDESIGNED CLEAN & PRACTICAL Laser Session */}
      <Modal
        title={
          <Space>
            <Zap size={18} color="#be185d" />
            <span>تسجيل جلسة ليزر جديدة</span>
          </Space>
        }
        open={isSessionModalOpen}
        onCancel={() => { setIsSessionModalOpen(false); sessionForm.resetFields(); }}
        onOk={() => sessionForm.submit()}
        okText="حفظ الجلسة في سجل الحالة"
        cancelText="إلغاء"
        width={640}
      >
        <Form form={sessionForm} layout="vertical" onFinish={handleSaveSession}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="patientName" label="اسم الحالة / العميلة" rules={[{ required: true, message: 'مطلوب كتابة اسم الحالة' }]}>
                <Input placeholder="الاسم الكامل للحالة" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="patientPhone" label="رقم الهاتف">
                <Input placeholder="01xxxxxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="bodyArea" label="منطقة الجسم" initialValue={selectedArea} rules={[{ required: true }]}>
                <Select
                  options={areas.map((a) => ({ value: a, label: a }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="sessionType" label="نوع الجلسة" initialValue="جلسة ضمن باكدج">
                <Select
                  options={[
                    { value: 'جلسة ضمن باكدج', label: 'جلسة ضمن باكدج (خصم من الرصيد)' },
                    { value: 'جلسة أساسية', label: 'جلسة منفصلة عادية' },
                    { value: 'جلسة رتوش (Touch-up)', label: 'جلسة رتوش مجانية' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="device" label="جهاز الليزر المستخدم" initialValue={selectedDevice}>
                <Select
                  options={devices.map((d) => ({ value: d, label: d }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="pulsesCount" label="عدد الضربات الفعلية (Shots)" initialValue={shotCount}>
                <InputNumber min={50} max={10000} step={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="fluenceJcm2" label="الطاقة (J/cm²)" initialValue={fluence}>
                <InputNumber min={6} max={40} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pulseWidthMs" label="عرض النبضة (ms)" initialValue={pulseDuration}>
                <InputNumber min={0.5} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="spotSizeMm" label="السبوت (mm)" initialValue={spotSize}>
                <InputNumber min={6} max={26} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="practitioner" label="الأخصائية المسؤولة عن الجلسة" initialValue="د. سارة القاضي">
            <Input />
          </Form.Item>

          <Form.Item name="notes" label="ملاحظات الجلسة">
            <Input.TextArea rows={2} placeholder="سجلي استجابة البشرة، أي تعليمات مهدئة أو موعد الرتوش القادم..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Add Custom Area */}
      <Modal
        title="إضافة منطقة ليزر جديدة لدليل العيادة"
        open={isAddAreaModalOpen}
        onCancel={() => { setIsAddAreaModalOpen(false); setNewAreaName(''); }}
        onOk={handleAddNewArea}
        okText="إضافة المنطقة"
        cancelText="إلغاء"
      >
        <div style={{ marginTop: 10 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>اسم المنطقة:</Text>
          <Input
            placeholder="مثال: نصف الذراع، أصابع اليدين، خط البطن..."
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal: Add Custom Device */}
      <Modal
        title="إضافة جهاز ليزر جديد للعيادة"
        open={isAddDeviceModalOpen}
        onCancel={() => { setIsAddDeviceModalOpen(false); setNewDeviceName(''); }}
        onOk={handleAddNewDevice}
        okText="إضافة الجهاز"
        cancelText="إلغاء"
      >
        <div style={{ marginTop: 10 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>اسم الجهاز وموديله:</Text>
          <Input
            placeholder="مثال: Candela GentleMax Pro Plus 2026 / Soprano Titanium"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
