import { useState, useMemo } from 'react';
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
} from 'antd';
import {
  Plus,
  Eye,
  Trash2,
  Sparkles,
  Camera,
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

const INITIAL_CASES: BeforeAfterCase[] = [
  {
    id: 'ba-1',
    patientName: 'لينا الحسن',
    patientId: 'PAT-00104',
    category: 'حقن وبوتوكس وفيلر',
    title: 'تحديد وامتلاء الشفاه الطبيعي بحقن الفيلر (Lip Augmentation)',
    treatmentArea: 'الشفاه وتحديد خط الكنتور (Vermilion Border)',
    treatmentDescription: 'حقن 1.0 mL فيلر Restylane Kysse بتقنية Micro-droplet لاستعادة الامتلاء والتناسق',
    timeElapsed: 'النتيجة بعد 14 يوماً من الجلسة',
    date: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
    doctor: 'د. هبة رمضان',
    notes: 'تحسن ملحوظ في تحديد قوس كيوبيد مع نعومة ومرونة طبيعية بدون أي تكتل أو كدمات.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    beforeCaption: 'قبل الجلسة: خطوط جفاف رفيعة مع عدم تماثل في الشفة العليا',
    afterCaption: 'بعد أسبوعين: امتلاء متناسق وترطيب عميق واستقامة الحواف',
  },
  {
    id: 'ba-2',
    patientName: 'دينا مصطفى',
    patientId: 'PAT-00088',
    category: 'حقن وبوتوكس وفيلر',
    title: 'علاج الخطوط التعبيرية للجبهة والجلابيلا بالبوتوكس (Upper Face Botox)',
    treatmentArea: 'الجلابيلا بين الحاجبين والجبهة (Glabella & Forehead)',
    treatmentDescription: 'حقن 26 وحدة Allergan Botox لتنعيم خطوط التعبس مع الحفاظ على الحركة الطبيعية للحواجب',
    timeElapsed: 'النتيجة بعد 10 أيام',
    date: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    doctor: 'د. هبة رمضان',
    notes: 'اختفاء كامل لخطوط 11 بين الحاجبين عند الضحك أو الغضب مع ثبات مظهر طبيعي مريح.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    beforeCaption: 'قبل الحقن: خطوط حركية عميقة بالجبهة والجلابيلا أثناء التعبير',
    afterCaption: 'بعد 10 أيام: نعومة تامة واسترخاء العضلات مع بقاء حركة الحاجب طبيعية',
  },
  {
    id: 'ba-3',
    patientName: 'مريم الصاوي',
    patientId: 'PAT-00120',
    category: 'عناية بالبشرة وهيدرافيشل',
    title: 'تنظيف مائي هيدرافيشل سينديو مع ماسك الذهب 24K (HydraGlow)',
    treatmentArea: 'كامل الوجه والرقبة (Face & Neck T-Zone)',
    treatmentDescription: 'شفط الرؤوس السوداء والتنظيف المائي بحمض الساليسيليك ثم ترطيب بماسك الذهب 24K',
    timeElapsed: 'النتيجة فورية بعد انتهاء الجلسة',
    date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    doctor: 'أخصائية البشرة ندى',
    notes: 'تضييق فوري للمسام الواسعة وإزالة الرؤوس السوداء مع لمعان وتوهج زجاجي للبشرة.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    beforeCaption: 'قبل الجلسة: مسام متسعة ورؤوس سوداء وجفاف بمنطقة الوجنتين',
    afterCaption: 'بعد الجلسة مباشرة: بشرة نظيفة تماماً، مسام منقبضة وتوهج نضارة واضح',
  },
  {
    id: 'ba-4',
    patientName: 'سارة فهمي',
    patientId: 'PAT-00140',
    category: 'ليزر وإزالة شعر',
    title: 'بروتوكول ليزر كانديلا جنتل ماكس برو لإزالة الشعر (Full Legs)',
    treatmentArea: 'الساقين كاملة (Full Legs Candela Laser)',
    treatmentDescription: 'ليزر الكسندريت 755nm بتبريد DCD ديناميكي بعد 4 جلسات منتظمة',
    timeElapsed: 'بعد 4 جلسات ليزر',
    date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    doctor: 'د. سارة القاضي',
    notes: 'انخفاض كثافة الشعر بنسبة 85% مع اختفاء جلد الوزة والالتهابات السابقة.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    beforeCaption: 'قبل البدء: شعر كثيف وسريع النمو مع انسداد المسام',
    afterCaption: 'بعد 4 جلسات: نعومة فائقة وخلو كامل من التصبغات والشعر النامي تحت الجلد',
  },
  {
    id: 'ba-5',
    patientName: 'فريدة صبري',
    patientId: 'PAT-00089',
    category: 'عناية بالجسم وسكراب',
    title: 'بروتوكول تفتيح وتنعيم الركب والأكواع بسكراب القهوة والبانثينول',
    treatmentArea: 'الركبتين والأكواع (Knees & Elbows)',
    treatmentDescription: 'سنفرة القهوة العضوية مع جلسة تقشير أحماض خفيفة وترطيب مكثف بالبانثينول',
    timeElapsed: 'بعد 3 جلسات علاجية',
    date: dayjs().subtract(12, 'day').format('YYYY-MM-DD'),
    doctor: 'أخصائية الجسم مريم',
    notes: 'توحيد لون الجلد وإزالة الخشونة الناتجة عن الاحتكاك.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    beforeCaption: 'قبل العلاج: تصبغات داكنة وخشونة بمفصل الركبة',
    afterCaption: 'بعد 3 جلسات: تفتيح واضح ودرجة متناسقة مع لون الجسم الطبيعي',
  },
];

export function BeforeAfterView() {
  const [cases, setCases] = useState<BeforeAfterCase[]>(() => {
    try {
      const raw = localStorage.getItem(LS_BA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_CASES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<BeforeAfterCase | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);
  const [form] = Form.useForm();

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
      beforeImageUrl: values.beforeImageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      afterImageUrl: values.afterImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
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
      title: 'توقيت النتيجة',
      dataIndex: 'timeElapsed',
      key: 'time',
      width: 150,
      render: (t: string) => (
        <Tag color="success" style={{ fontWeight: 600 }}>
          {t}
        </Tag>
      ),
    },
    {
      title: 'الطبيبة / المعالج',
      dataIndex: 'doctor',
      key: 'doctor',
      width: 130,
      render: (doc: string) => <span style={{ fontSize: 12 }}>{doc}</span>,
    },
    {
      title: 'معاينة المقارنة',
      key: 'action',
      width: 170,
      render: (_: any, r: BeforeAfterCase) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            icon={<Eye size={13} />}
            style={{
              backgroundColor: '#be185d',
              borderColor: '#be185d',
              fontWeight: 600,
              borderRadius: 6,
            }}
            onClick={() => {
              setSelectedCase(r);
              setIsCompareOpen(true);
            }}
          >
            عرض قبل وبعد
          </Button>
          <Popconfirm title="حذف هذا السجل؟" onConfirm={() => handleDelete(r.id)} okText="نعم" cancelText="إلغاء">
            <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
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
                  معرض التحولات السريرية (قبل وبعد — Before & After)
                </Title>
                <Text style={{ color: '#fce7f3', fontSize: 13 }}>
                  توثيق مصوّر مفروز حسب التخصص الطبي: جلسات البشرة والهيدرافيشل، الليزر، حقن البوتوكس والفيلر، العناية بالجسم والسبا
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
              <Form.Item name="patientId" label="كود الملف الطبي (MRN)" initialValue="PAT-00104">
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

      {/* Side-by-Side Before & After Comparison Modal */}
      <Modal
        title={
          <Space>
            <Sparkles size={18} color="#be185d" />
            <span style={{ fontWeight: 700 }}>
              مقارنة النتائج السريرية (قبل وبعد) — {selectedCase?.patientName}
            </span>
          </Space>
        }
        open={isCompareOpen}
        onCancel={() => setIsCompareOpen(false)}
        footer={null}
        width={820}
      >
        {selectedCase && (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {selectedCase.treatmentDescription}
            </Text>

            <Row gutter={20}>
              <Col span={12}>
                <Card
                  title={<span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 قبل الجلسة (BEFORE)</span>}
                  size="small"
                  style={{ borderRadius: 12, border: '1px solid #fecaca' }}
                  cover={
                    <img
                      alt="Before treatment"
                      src={selectedCase.beforeImageUrl}
                      style={{ height: 280, objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                    />
                  }
                >
                  <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                    {selectedCase.beforeCaption}
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card
                  title={<span style={{ color: '#059669', fontWeight: 700 }}>🟢 بعد العلاج (AFTER)</span>}
                  size="small"
                  style={{ borderRadius: 12, border: '1px solid #a7f3d0' }}
                  cover={
                    <img
                      alt="After treatment"
                      src={selectedCase.afterImageUrl}
                      style={{ height: 280, objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                    />
                  }
                >
                  <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    {selectedCase.afterCaption}
                  </div>
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569' }}>
              👨‍⚕️ <strong>الطبيب المعالج:</strong> {selectedCase.doctor} • 📋 <strong>الملاحظات:</strong> {selectedCase.notes || 'لا توجد مضاعفات وتناسق ممتاز'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
