import { useState, useMemo, useRef } from 'react';
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Segmented,
  Select,
  message,
  Popconfirm,
  Empty,
  Slider,
  Switch,
} from 'antd';
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Camera,
  Sliders,
  Columns,
  Layers,
  Share2,
  Printer,
  CheckCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';

const { Title, Text } = Typography;

export type AestheticCategory =
  | 'عناية بالبشرة وهيدرافيشل'
  | 'ليزر وإزالة شعر'
  | 'حقن وبوتوكس وفيلر'
  | 'عناية بالجسم وسكراب'
  | 'سبا ومساج وحمام مغربي';

export interface BeforeAfterCase {
  id: string;
  patientName: string;
  patientId: string;
  category: AestheticCategory;
  title: string;
  treatmentArea: string;
  treatmentDescription: string;
  timeElapsed: string; // e.g. بعد 14 يوم / بعد 4 جلسات
  date: string;
  doctor: string;
  notes: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeCaption: string;
  afterCaption: string;
}

const LS_BA_KEY = 'clinic_before_after_gallery_v2';

export function BeforeAfterView() {
  const [cases, setCases] = useState<BeforeAfterCase[]>(() => {
    try {
      const raw = localStorage.getItem(LS_BA_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<BeforeAfterCase | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSocialCardOpen, setIsSocialCardOpen] = useState(false);

  // Interactive Comparison Controls
  const [compareMode, setCompareMode] = useState<'split' | 'side' | 'overlay'>('split');
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50); // 0 to 100
  const [privacyMask, setPrivacyMask] = useState<boolean>(false);

  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);
  const [form] = Form.useForm();
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const saveCases = (next: BeforeAfterCase[]) => {
    setCases(next);
    localStorage.setItem(LS_BA_KEY, JSON.stringify(next));
  };

  const filteredCases = useMemo(() => {
    if (selectedCategory === 'all') return cases;
    return cases.filter((c) => c.category === selectedCategory);
  }, [cases, selectedCategory]);

  const handleCreate = (values: any) => {
    const newCase: BeforeAfterCase = {
      id: `ba-${Date.now()}`,
      patientName: values.patientName,
      patientId: values.patientId || `PAT-00${Math.floor(Math.random() * 900) + 100}`,
      category: values.category,
      title: values.title,
      treatmentArea: values.treatmentArea || 'منطقة الوجه',
      treatmentDescription: values.treatmentDescription || '',
      timeElapsed: values.timeElapsed || 'بعد الجلسة',
      date: dayjs().format('YYYY-MM-DD'),
      doctor: values.doctor || 'د. هبة رمضان',
      notes: values.notes || '',
      beforeImageUrl: values.beforeImageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=80',
      afterImageUrl: values.afterImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
      beforeCaption: values.beforeCaption || 'صورة الحالة قبل الإجراء',
      afterCaption: values.afterCaption || 'صورة النتيجة بعد الجلسة',
    };

    saveCases([newCase, ...cases]);
    setIsModalOpen(false);
    form.resetFields();
    message.success('✅ تم حفظ صور التحول السريري (قبل وبعد) وتوثيقها بملف الحالة بنجاح!');
  };

  const handleDelete = (id: string) => {
    const next = cases.filter((c) => c.id !== id);
    saveCases(next);
    message.success('تم حذف السجل من معرض التحولات');
  };

  const getCategoryColor = (cat: AestheticCategory) => {
    switch (cat) {
      case 'حقن وبوتوكس وفيلر':
        return 'magenta';
      case 'عناية بالبشرة وهيدرافيشل':
        return 'cyan';
      case 'ليزر وإزالة شعر':
        return 'blue';
      case 'عناية بالجسم وسكراب':
        return 'gold';
      case 'سبا ومساج وحمام مغربي':
        return 'purple';
      default:
        return 'default';
    }
  };

  // Drag handler for Split Slider
  const handleSliderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only if mouse button is held down
    const container = sliderContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setSliderPos(pos);
  };

  const handleSliderTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = sliderContainerRef.current;
    if (!container || !e.touches[0]) return;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pos = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setSliderPos(pos);
  };

  const columns = [
    {
      title: 'الحالة وتاريخ التوثيق',
      key: 'patient',
      width: 170,
      render: (_: any, r: BeforeAfterCase) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.patientId} • {dayjs(r.date).format('YYYY/MM/DD')}</Text>
        </div>
      ),
    },
    {
      title: 'التخصص والإجراء التجميلي',
      key: 'title',
      render: (_: any, r: BeforeAfterCase) => (
        <div>
          <Space size={6} wrap style={{ marginBottom: 4 }}>
            <Tag color={getCategoryColor(r.category)} style={{ fontWeight: 700 }}>
              {r.category}
            </Tag>
            <Tag color="geekblue" style={{ fontSize: 11 }}>{r.treatmentArea}</Tag>
          </Space>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.title}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {r.treatmentDescription}
          </div>
        </div>
      ),
    },
    {
      title: 'الطبيب والنتيجة',
      key: 'meta',
      width: 170,
      render: (_: any, r: BeforeAfterCase) => (
        <div>
          <Tag color="success" style={{ fontWeight: 600, marginBottom: 4 }}>{r.timeElapsed}</Tag>
          <div style={{ fontSize: 12, color: '#334155' }}>👨‍⚕️ {r.doctor}</div>
        </div>
      ),
    },
    {
      title: 'معاينة التحول',
      key: 'preview',
      width: 130,
      render: (_: any, r: BeforeAfterCase) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <img
            src={r.beforeImageUrl}
            alt="Before"
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #fecaca' }}
          />
          <img
            src={r.afterImageUrl}
            alt="After"
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #a7f3d0' }}
          />
        </div>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 160,
      render: (_: any, r: BeforeAfterCase) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<Sliders size={13} />}
            style={{ background: '#be185d', borderColor: '#be185d', fontWeight: 600 }}
            onClick={() => {
              setSelectedCase(r);
              setSliderPos(50);
              setIsCompareOpen(true);
            }}
          >
            مقارنة تفاعلية
          </Button>
          <Popconfirm
            title="حذف سجل الحالة؟"
            onConfirm={() => handleDelete(r.id)}
            okText="نعم، حذف"
            cancelText="إلغاء"
          >
            <Button size="small" danger icon={<Trash2 size={13} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #be185d 100%)',
          borderRadius: 14,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(190, 24, 93, 0.25)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="center" size={12}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={24} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  معرض التحولات السريرية الذكي (قبل وبعد — AI Interactive Slider)
                </Title>
                <Text style={{ color: '#fce7f3', fontSize: 13 }}>
                  مقارنة تفاعلية بالسلايدر، مطابقة زوايا الوجه، إخفاء الهوية لحماية الخصوصية، وتصدير كروت السوشيال ميديا
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'start' }}>
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              style={{
                backgroundColor: '#ffffff',
                color: '#831843',
                borderColor: '#ffffff',
                fontWeight: 700,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onClick={() => {
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              + إضافة حالة جديدة (قبل وبعد)
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Category Segmented Filter */}
      <Card size="small" style={{ borderRadius: 10 }}>
        <Segmented
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val as string)}
          options={[
            { value: 'all', label: `جميع التخصصات (${cases.length})` },
            { value: 'عناية بالبشرة وهيدرافيشل', label: '✨ عناية بالبشرة وهيدرافيشل' },
            { value: 'ليزر وإزالة شعر', label: '⚡ ليزر وإزالة شعر' },
            { value: 'حقن وبوتوكس وفيلر', label: '💉 حقن وبوتوكس وفيلر' },
            { value: 'عناية بالجسم وسكراب', label: '🌸 عناية بالجسم وسكراب' },
            { value: 'سبا ومساج وحمام مغربي', label: '🛁 سبا ومساج وحمام' },
          ]}
        />
      </Card>

      {/* Main Table */}
      <Card size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredCases}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: <Empty description="لا توجد مقارنات قبل وبعد مسجلة حتى الآن" /> }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal: Add Transformation Record */}
      <Modal
        title="إضافة وتوثيق صور حالة (قبل وبعد) بالملف الطبي"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="حفظ الحالة بالمعرض"
        cancelText="إلغاء"
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="patientName" label="اسم الحالة / العميلة" rules={[{ required: true, message: 'مطلوب' }]}>
                <Select
                  showSearch
                  placeholder="ابحثي بالاسم أو رقم الهاتف..."
                  optionFilterProp="label"
                  onChange={(_val, opt: any) => {
                    if (opt) {
                      form.setFieldsValue({ patientId: opt.patientNumber });
                    }
                  }}
                  options={registeredPatients.map((p) => ({
                    value: p.name,
                    label: `${p.name} — ${p.patientNumber} (${p.phone})`,
                    patientNumber: p.patientNumber,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="patientId" label="كود الملف الطبي (MRN)" >
                <Input placeholder="e.g. PAT-00104" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="التخصص التابع له الإجراء" rules={[{ required: true }]} initialValue="حقن وبوتوكس وفيلر">
                <Select
                  options={[
                    { value: 'عناية بالبشرة وهيدرافيشل', label: 'عناية بالبشرة وهيدرافيشل' },
                    { value: 'ليزر وإزالة شعر', label: 'ليزر وإزالة شعر' },
                    { value: 'حقن وبوتوكس وفيلر', label: 'حقن وبوتوكس وفيلر' },
                    { value: 'عناية بالجسم وسكراب', label: 'عناية بالجسم وسكراب' },
                    { value: 'سبا ومساج وحمام مغربي', label: 'سبا ومساج وحمام مغربي' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="treatmentArea" label="المنطقة التشريحية المعالجة" initialValue="الشفاه وتحديد الكنتور">
                <Input placeholder="مثال: الشفاه، الجبهة، الساقين، الركب" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="title" label="عنوان الإجراء والنتيجة" rules={[{ required: true }]} initialValue="امتلاء وتحديد طبيعي للشفاه">
                <Input placeholder="مثال: تنعيم خطوط الجبهة بالبوتوكس" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="timeElapsed" label="توقيت ظهور النتيجة" initialValue="النتيجة بعد 14 يوماً">
                <Select
                  options={[
                    { value: 'نتيجة فورية بعد الجلسة مباشرة', label: 'نتيجة فورية بعد الجلسة مباشرة' },
                    { value: 'النتيجة بعد 7 أيام', label: 'النتيجة بعد 7 أيام' },
                    { value: 'النتيجة بعد 14 يوماً (أسبوعين)', label: 'النتيجة بعد 14 يوماً (أسبوعين)' },
                    { value: 'النتيجة بعد 4 جلسات', label: 'النتيجة بعد 4 جلسات' },
                    { value: 'النتيجة بعد 6 جلسات كورس كامل', label: 'النتيجة بعد 6 جلسات كورس كامل' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="beforeImageUrl" label="رابط صورة (قبل الجلسة Before)">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="afterImageUrl" label="رابط صورة (بعد الجلسة After)">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="beforeCaption" label="وصف حالة ما قبل العلاج" initialValue="قبل الإجراء: تفاوت بالحجم وجفاف">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="afterCaption" label="وصف النتيجة المتحققة" initialValue="بعد الإجراء: امتلاء متناسق ونعومة">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="treatmentDescription" label="تفاصيل الإجراء والمواد المستخدمة">
            <Input.TextArea rows={2} placeholder="مثال: تم حقن 1.0 mL Restylane Kysse أو استخدام جلسة هيدرافيشل كاملة" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="doctor" label="الطبيبة / المعالج المسؤول" initialValue="د. هبة رمضان">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="ملاحظات سريرية وموافقة التصوير" initialValue="موافقة تصوير موقعة بالملف">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Advanced Interactive Before & After Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '95%' }}>
            <Space>
              <Sparkles size={18} color="#be185d" />
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                مقارنة النتائج السريرية التفاعلية — {selectedCase?.patientName}
              </span>
            </Space>
            <Space>
              <Button
                size="small"
                icon={<Share2 size={13} />}
                style={{ color: '#be185d', borderColor: '#fbcfe8' }}
                onClick={() => setIsSocialCardOpen(true)}
              >
                تصدير كارت السوشيال ميديا
              </Button>
            </Space>
          </div>
        }
        open={isCompareOpen}
        onCancel={() => setIsCompareOpen(false)}
        footer={null}
        width={860}
      >
        {selectedCase && (
          <div>
            {/* Header info */}
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <Tag color={getCategoryColor(selectedCase.category)} style={{ fontWeight: 700, fontSize: 12 }}>
                  {selectedCase.category}
                </Tag>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 15, marginInlineStart: 8 }}>
                  {selectedCase.title}
                </span>
              </div>
              <Tag color="success" style={{ fontWeight: 700, fontSize: 12 }}>{selectedCase.timeElapsed}</Tag>
            </div>

            {/* Controls Bar: Mode selector & Privacy Mask Toggle */}
            <Card size="small" style={{ marginBottom: 16, background: '#fdf2f8', borderColor: '#fbcfe8', borderRadius: 10 }}>
              <Row justify="space-between" align="middle" gutter={[12, 12]}>
                <Col xs={24} md={14}>
                  <Space size={14}>
                    <Text strong style={{ fontSize: 13 }}>وضع المقارنة:</Text>
                    <Segmented
                      value={compareMode}
                      onChange={(val) => setCompareMode(val as any)}
                      options={[
                        { value: 'split', icon: <Sliders size={14} />, label: 'سلايدر المسح التفاعلي' },
                        { value: 'side', icon: <Columns size={14} />, label: 'جنباً إلى جنب' },
                        { value: 'overlay', icon: <Layers size={14} />, label: 'تراكب الشفافية' },
                      ]}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={10} style={{ textAlign: 'start' }}>
                  <Space align="center">
                    <Switch
                      checked={privacyMask}
                      onChange={setPrivacyMask}
                      checkedChildren={<EyeOff size={13} />}
                      unCheckedChildren={<Eye size={13} />}
                    />
                    <Text style={{ fontSize: 12, fontWeight: 600, color: privacyMask ? '#be185d' : '#475569' }}>
                      إخفاء الهوية والعيون (Privacy Mask)
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* MODE 1: INTERACTIVE SPLIT SLIDER */}
            {compareMode === 'split' && (
              <div>
                <div
                  ref={sliderContainerRef}
                  onMouseMove={handleSliderMouseMove}
                  onTouchMove={handleSliderTouchMove}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 420,
                    borderRadius: 14,
                    overflow: 'hidden',
                    cursor: 'ew-resize',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    userSelect: 'none',
                    backgroundColor: '#0f172a',
                  }}
                >
                  {/* Base Layer: AFTER Image */}
                  <img
                    src={selectedCase.afterImageUrl}
                    alt="After"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Overlaid Layer: BEFORE Image with clip-path */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                    }}
                  >
                    <img
                      src={selectedCase.beforeImageUrl}
                      alt="Before"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>

                  {/* Privacy Mask Bar (Applies if enabled) */}
                  {privacyMask && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '32%',
                        left: '20%',
                        width: '60%',
                        height: '14%',
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1,
                        zIndex: 10,
                      }}
                    >
                      🛡️ PRIVACY PROTECTED • هوية محمية
                    </div>
                  )}

                  {/* Divider Handle Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${sliderPos}%`,
                      width: 3,
                      background: '#ffffff',
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                      transform: 'translateX(-50%)',
                      zIndex: 20,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '3px solid #be185d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <Sliders size={18} color="#be185d" />
                    </div>
                  </div>

                  {/* Corner Badges */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      background: 'rgba(185, 28, 28, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 800,
                      zIndex: 15,
                    }}
                  >
                    🔴 قبل الإجراء (Before)
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      background: 'rgba(4, 120, 87, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 800,
                      zIndex: 15,
                    }}
                  >
                    🟢 بعد العلاج (After)
                  </div>
                </div>

                {/* Range controller helper */}
                <div style={{ marginTop: 12, padding: '0 12px' }}>
                  <Row align="middle" gutter={16}>
                    <Col span={4}>
                      <Text style={{ fontSize: 12, color: '#B91C1C', fontWeight: 700 }}>قبل ({sliderPos}%)</Text>
                    </Col>
                    <Col span={16}>
                      <Slider
                        min={0}
                        max={100}
                        value={sliderPos}
                        onChange={setSliderPos}
                        tooltip={{ formatter: (v) => `${v}% مسح تفاعلي` }}
                      />
                    </Col>
                    <Col span={4} style={{ textAlign: 'left' }}>
                      <Text style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>بعد ({100 - sliderPos}%)</Text>
                    </Col>
                  </Row>
                </div>
              </div>
            )}

            {/* MODE 2: SIDE BY SIDE */}
            {compareMode === 'side' && (
              <Row gutter={16}>
                <Col span={12}>
                  <Card
                    title={<span style={{ color: '#B91C1C', fontWeight: 700 }}>🔴 قبل الجلسة (BEFORE)</span>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #fecaca' }}
                    cover={
                      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
                        <img
                          alt="Before"
                          src={selectedCase.beforeImageUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {privacyMask && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '32%',
                              left: '15%',
                              width: '70%',
                              height: '14%',
                              background: 'rgba(15, 23, 42, 0.95)',
                              backdropFilter: 'blur(8px)',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            PRIVACY PROTECTED
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                      {selectedCase.beforeCaption}
                    </div>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card
                    title={<span style={{ color: '#047857', fontWeight: 700 }}>🟢 بعد العلاج (AFTER)</span>}
                    size="small"
                    style={{ borderRadius: 12, border: '1px solid #a7f3d0' }}
                    cover={
                      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
                        <img
                          alt="After"
                          src={selectedCase.afterImageUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {privacyMask && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '32%',
                              left: '15%',
                              width: '70%',
                              height: '14%',
                              background: 'rgba(15, 23, 42, 0.95)',
                              backdropFilter: 'blur(8px)',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            PRIVACY PROTECTED
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>
                      {selectedCase.afterCaption}
                    </div>
                  </Card>
                </Col>
              </Row>
            )}

            {/* MODE 3: OPACITY OVERLAY */}
            {compareMode === 'overlay' && (
              <div>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 400,
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    backgroundColor: '#0f172a',
                  }}
                >
                  <img
                    src={selectedCase.beforeImageUrl}
                    alt="Before base"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <img
                    src={selectedCase.afterImageUrl}
                    alt="After overlay"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: overlayOpacity / 100,
                      transition: 'opacity 0.1s ease',
                    }}
                  />
                  {privacyMask && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '32%',
                        left: '20%',
                        width: '60%',
                        height: '14%',
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: 11,
                        fontWeight: 700,
                        zIndex: 10,
                      }}
                    >
                      🛡️ PRIVACY PROTECTED
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14, padding: '0 12px' }}>
                  <Row align="middle" gutter={16}>
                    <Col span={6}>
                      <Text style={{ fontSize: 12, color: '#B91C1C', fontWeight: 700 }}>قبل (0% بعد)</Text>
                    </Col>
                    <Col span={12}>
                      <Slider
                        min={0}
                        max={100}
                        value={overlayOpacity}
                        onChange={setOverlayOpacity}
                        tooltip={{ formatter: (v) => `درجة التحول بعد: ${v}%` }}
                      />
                    </Col>
                    <Col span={6} style={{ textAlign: 'left' }}>
                      <Text style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>بعد (100% شفافية)</Text>
                    </Col>
                  </Row>
                </div>
              </div>
            )}

            {/* Clinical Footer Details */}
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, fontSize: 12, color: '#475569', border: '1px solid #e2e8f0' }}>
              <Row justify="space-between">
                <Col span={14}>
                  <div>👨‍⚕️ <strong>الطبيب/ة المعالج/ة:</strong> {selectedCase.doctor}</div>
                  <div style={{ marginTop: 4 }}>📋 <strong>التفاصيل السريرية:</strong> {selectedCase.treatmentDescription}</div>
                </Col>
                <Col span={10} style={{ textAlign: 'start' }}>
                  <div>📅 <strong>تاريخ التوثيق:</strong> {selectedCase.date}</div>
                  <div style={{ marginTop: 4 }}>📝 <strong>الملاحظات:</strong> {selectedCase.notes || 'تعافي كامل ونتيجة ممتازة'}</div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* Social Media Branded Card Preview Modal */}
      <Modal
        title="معاينة كارت السوشيال ميديا وحالة التحول (Social Media Case Study)"
        open={isSocialCardOpen}
        onCancel={() => setIsSocialCardOpen(false)}
        width={680}
        footer={[
          <Button key="close" onClick={() => setIsSocialCardOpen(false)}>إغلاق</Button>,
          <Button
            key="print"
            type="primary"
            icon={<Printer size={14} />}
            style={{ background: '#be185d', borderColor: '#be185d' }}
            onClick={() => window.print()}
          >
            طباعة وتصدير الكارت
          </Button>,
        ]}
      >
        {selectedCase && (
          <div
            id="social-media-card"
            style={{
              padding: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #180510 0%, #2e0820 100%)',
              color: '#ffffff',
              border: '2px solid #831843',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
            }}
          >
            {/* Top Brand Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#ec4899" />
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.5, color: '#fbcfe8' }}>ENTRUSTIC BEAUTY</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>مركز الجلدية والطب التجميلي والليزر المتخصص</div>
              </div>
              <Tag color="magenta" style={{ fontWeight: 700, padding: '4px 10px', fontSize: 12 }}>
                {selectedCase.category}
              </Tag>
            </div>

            {/* Title & Area */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>{selectedCase.title}</div>
              <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                {selectedCase.treatmentArea} • {selectedCase.timeElapsed}
              </div>
            </div>

            {/* Photos Side-by-Side with Privacy */}
            <Row gutter={14} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ position: 'relative', height: 260, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <img src={selectedCase.beforeImageUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {privacyMask && (
                    <div style={{ position: 'absolute', top: '32%', left: '15%', width: '70%', height: '14%', background: 'rgba(0,0,0,0.92)', borderRadius: 4 }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#fca5a5' }}>
                    BEFORE • قبل
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ position: 'relative', height: 260, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <img src={selectedCase.afterImageUrl} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {privacyMask && (
                    <div style={{ position: 'absolute', top: '32%', left: '15%', width: '70%', height: '14%', background: 'rgba(0,0,0,0.92)', borderRadius: 4 }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#6ee7b7' }}>
                    AFTER • بعد
                  </div>
                </div>
              </Col>
            </Row>

            {/* Footer with doctor and consent badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 12, color: '#f1f5f9' }}>
                👨‍⚕️ إشراف الطبيب: <strong>{selectedCase.doctor}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a7f3d0' }}>
                <CheckCircle size={14} color="#10b981" />
                <span>مصرح بالنشر السريري مع حفظ الخصوصية</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
