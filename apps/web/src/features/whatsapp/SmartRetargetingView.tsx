import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Input,
  Select,
  Modal,
  Segmented,
  message,
  Tooltip,
} from 'antd';
import {
  MessageSquare,
  Send,
  Sparkles,
  Phone,
  Clock,
  CheckCircle,
  Gift,
  Search,
  ExternalLink,
  Zap,
  Syringe,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  openWhatsAppDirect,
  templateRetargetingBotoxFiller,
  templateRetargetingLaserInterval,
  templateRetargetingFacialGlow,
  templateRetargetingInactiveWinBack,
} from './whatsapp-helpers';

const { Title, Text } = Typography;

export type RetargetCategory = 'all' | 'botox' | 'laser' | 'skincare' | 'winback';

export interface RetargetCandidate {
  id: string;
  name: string;
  phone: string;
  patientNumber: string;
  category: 'botox' | 'laser' | 'skincare' | 'winback';
  categoryLabel: string;
  lastProcedure: string;
  doctor: string;
  lastVisitDate: string; // YYYY-MM-DD
  daysSinceLastVisit: number;
  recommendedAction: string;
  contactStatus: 'pending' | 'sent' | 'rebooked';
}

const INITIAL_CANDIDATES: RetargetCandidate[] = [
  {
    id: 'ret-1',
    name: 'دينا مصطفى',
    phone: '01098765432',
    patientNumber: 'PAT-00088',
    category: 'botox',
    categoryLabel: 'تجديد البوتوكس',
    lastProcedure: 'حقن بوتوكس الجبهة والجلابيلا (26 وحدة)',
    doctor: 'د. هبة رمضان',
    lastVisitDate: dayjs().subtract(130, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 130,
    recommendedAction: 'تجديد حقن التوكسين قبل زوال استرخاء العضلات (4.5 أشهر)',
    contactStatus: 'pending',
  },
  {
    id: 'ret-2',
    name: 'ياسمين عبد العزيز',
    phone: '01123456789',
    patientNumber: 'PAT-00072',
    category: 'botox',
    categoryLabel: 'تجديد الفيلر',
    lastProcedure: 'فيلر شفايف Restylane Kysse',
    doctor: 'د. هبة رمضان',
    lastVisitDate: dayjs().subtract(155, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 155,
    recommendedAction: 'جلسة رتوش ونضارة الشفاه السنوية (5 أشهر)',
    contactStatus: 'pending',
  },
  {
    id: 'ret-3',
    name: 'سارة فهمي',
    phone: '01011223344',
    patientNumber: 'PAT-00140',
    category: 'laser',
    categoryLabel: 'كورس الليزر الدوري',
    lastProcedure: 'جلسة ليزر كانديلا (ساقين كاملة)',
    doctor: 'د. سارة القاضي',
    lastVisitDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 29,
    recommendedAction: 'حان موعد الجلسة الخامسة (مرور 4 أسابيع على الجلسة السابقة)',
    contactStatus: 'pending',
  },
  {
    id: 'ret-4',
    name: 'منى الشاذلي',
    phone: '01234567801',
    patientNumber: 'PAT-00045',
    category: 'laser',
    categoryLabel: 'كورس الليزر الدوري',
    lastProcedure: 'ليزر كانديلا (بكينى وأندر آرم)',
    doctor: 'د. سارة القاضي',
    lastVisitDate: dayjs().subtract(35, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 35,
    recommendedAction: 'تأخرت أسبوعاً عن موعد الجلسة الدورية لاستهداف طور Anagen',
    contactStatus: 'sent',
  },
  {
    id: 'ret-5',
    name: 'مريم الصاوي',
    phone: '01555667788',
    patientNumber: 'PAT-00120',
    category: 'skincare',
    categoryLabel: 'هيدرافيشل شهري',
    lastProcedure: 'تنظيف عميق هيدرافيشل سينديو وماسك الذهب',
    doctor: 'أخصائية البشرة ندى',
    lastVisitDate: dayjs().subtract(26, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 26,
    recommendedAction: 'جلسة النضارة الشهرية وتجديد نضارة خلايا البشرة',
    contactStatus: 'pending',
  },
  {
    id: 'ret-6',
    name: 'رنا السيد',
    phone: '01055443322',
    patientNumber: 'PAT-00099',
    category: 'skincare',
    categoryLabel: 'تقشير أحماض',
    lastProcedure: 'جلسة تقشير كيميائي تفتيح ونضارة',
    doctor: 'أخصائية البشرة ندى',
    lastVisitDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 30,
    recommendedAction: 'جلسة الترطيب والتقشير الثانية لاستكمال التفتيح',
    contactStatus: 'pending',
  },
  {
    id: 'ret-7',
    name: 'هند حسام',
    phone: '01199887766',
    patientNumber: 'PAT-00030',
    category: 'winback',
    categoryLabel: 'عميلة غائبة',
    lastProcedure: 'حمام مغربي ومساج ملكي',
    doctor: 'أخصائية السبا فاطمة',
    lastVisitDate: dayjs().subtract(75, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 75,
    recommendedAction: 'غائبة منذ 75 يوماً — تقديم كود خصم 15% لاستعادتها',
    contactStatus: 'pending',
  },
  {
    id: 'ret-8',
    name: 'نادين حسني',
    phone: '01288776655',
    patientNumber: 'PAT-00022',
    category: 'winback',
    categoryLabel: 'عميلة غائبة',
    lastProcedure: 'جلسة هيدرافيشل وسيروم',
    doctor: 'أخصائية البشرة ندى',
    lastVisitDate: dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
    daysSinceLastVisit: 90,
    recommendedAction: 'غائبة منذ 3 أشهر — إرسال دعوة جلسة نضارة مجانية أو خصم',
    contactStatus: 'rebooked',
  },
];

const LS_RETARGET_KEY = 'clinic_smart_retargeting_v1';

export function SmartRetargetingView({ clinicName = 'Entrustic Beauty' }: { clinicName?: string }) {
  const [candidates, setCandidates] = useState<RetargetCandidate[]>(() => {
    try {
      const raw = localStorage.getItem(LS_RETARGET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_CANDIDATES;
  });

  const [activeCategory, setActiveCategory] = useState<RetargetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'rebooked'>('all');

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<RetargetCandidate | null>(null);
  const [messageBody, setMessageBody] = useState('');

  const saveCandidates = (next: RetargetCandidate[]) => {
    setCandidates(next);
    localStorage.setItem(LS_RETARGET_KEY, JSON.stringify(next));
  };

  const generateDefaultMessage = (c: RetargetCandidate): string => {
    switch (c.category) {
      case 'botox':
        return templateRetargetingBotoxFiller({
          clinicName,
          patientName: c.name,
          lastProcedureName: c.lastProcedure,
          lastProcedureDate: c.lastVisitDate,
          doctorName: c.doctor,
        });
      case 'laser':
        return templateRetargetingLaserInterval({
          clinicName,
          patientName: c.name,
          lastSessionDate: c.lastVisitDate,
          areaName: c.lastProcedure.split('(')[1]?.replace(')', '') || 'الجلسة المجدولة',
        });
      case 'skincare':
        return templateRetargetingFacialGlow({
          clinicName,
          patientName: c.name,
        });
      case 'winback':
        return templateRetargetingInactiveWinBack({
          clinicName,
          patientName: c.name,
          specialOffer: 'خصم ترحيبي 15% على أي جلسة نضارة أو ليزر هذا الأسبوع',
        });
      default:
        return `مرحباً ${c.name}، تحياتنا من عيادة ${clinicName}. يسعدنا الاطمئنان عليك وتنسيق موعد جلستك القادمة.`;
    }
  };

  const handleOpenPreview = (c: RetargetCandidate) => {
    setSelectedCandidate(c);
    setMessageBody(generateDefaultMessage(c));
    setPreviewModalOpen(true);
  };

  const handleSendWhatsApp = (c: RetargetCandidate, customMsg?: string) => {
    const textToSend = customMsg || generateDefaultMessage(c);
    const success = openWhatsAppDirect(c.phone, textToSend);
    if (success) {
      const next = candidates.map((item) =>
        item.id === c.id ? { ...item, contactStatus: 'sent' as const } : item
      );
      saveCandidates(next);
      message.success(`📲 تم فتح واتساب لإرسال رسالة التذكير إلى [${c.name}] بنجاح`);
    } else {
      message.error('تعذر فتح واتساب، يرجى التأكد من صحة رقم الهاتف');
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'pending' | 'sent' | 'rebooked') => {
    const next = candidates.map((item) =>
      item.id === id ? { ...item, contactStatus: newStatus } : item
    );
    saveCandidates(next);
    message.success('تم تحديث حالة التواصل');
  };

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchCat = activeCategory === 'all' || c.category === activeCategory;
      const matchStatus = statusFilter === 'all' || c.contactStatus === statusFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        c.name.includes(searchQuery) ||
        c.phone.includes(searchQuery) ||
        c.lastProcedure.includes(searchQuery);
      return matchCat && matchStatus && matchSearch;
    });
  }, [candidates, activeCategory, statusFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const pendingCount = candidates.filter((c) => c.contactStatus === 'pending').length;
    const sentCount = candidates.filter((c) => c.contactStatus === 'sent').length;
    const rebookedCount = candidates.filter((c) => c.contactStatus === 'rebooked').length;
    // Estimate recovered revenue: average 1,500 EGP per rebooked aesthetic session
    const estimatedRecoveredEgp = rebookedCount * 1500;

    return { pendingCount, sentCount, rebookedCount, estimatedRecoveredEgp };
  }, [candidates]);

  const columns = [
    {
      title: 'العميلة ورقم الهاتف',
      key: 'client',
      width: 180,
      render: (_: any, r: RetargetCandidate) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{r.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Phone size={12} color="#047857" />
            <Text style={{ fontSize: 12, direction: 'ltr', color: '#334155' }}>{r.phone}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.patientNumber}</Text>
        </div>
      ),
    },
    {
      title: 'نوع دورة التذكير',
      key: 'cat',
      width: 150,
      render: (_: any, r: RetargetCandidate) => {
        let color = 'blue';
        let icon = <Clock size={13} />;
        if (r.category === 'botox') {
          color = 'magenta';
          icon = <Syringe size={13} />;
        } else if (r.category === 'laser') {
          color = 'cyan';
          icon = <Zap size={13} />;
        } else if (r.category === 'skincare') {
          color = 'gold';
          icon = <Sparkles size={13} />;
        } else if (r.category === 'winback') {
          color = 'purple';
          icon = <Gift size={13} />;
        }

        return (
          <Tag color={color} style={{ fontWeight: 700, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {icon}
            <span>{r.categoryLabel}</span>
          </Tag>
        );
      },
    },
    {
      title: 'آخر جلسة والطبيبة',
      key: 'proc',
      render: (_: any, r: RetargetCandidate) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.lastProcedure}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            👨‍⚕️ {r.doctor} • 📅 {r.lastVisitDate}
          </div>
        </div>
      ),
    },
    {
      title: 'الفترة المنقضية والتوصية السريرية',
      key: 'rec',
      render: (_: any, r: RetargetCandidate) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Tag color={r.daysSinceLastVisit >= 60 ? 'error' : r.daysSinceLastVisit >= 28 ? 'warning' : 'processing'}>
              {r.daysSinceLastVisit} يوم مضت
            </Tag>
          </div>
          <Text style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
            {r.recommendedAction}
          </Text>
        </div>
      ),
    },
    {
      title: 'حالة التواصل',
      dataIndex: 'contactStatus',
      key: 'status',
      width: 140,
      render: (s: string, r: RetargetCandidate) => (
        <Select
          size="small"
          value={s}
          onChange={(val) => handleUpdateStatus(r.id, val as 'pending' | 'sent' | 'rebooked')}
          style={{ width: 130 }}
          options={[
            { value: 'pending', label: '⏳ بانتظار الإرسال' },
            { value: 'sent', label: '📲 تم التواصل' },
            { value: 'rebooked', label: '✅ تم الحجز مجدداً' },
          ]}
        />
      ),
    },
    {
      title: 'إجراءات واتساب',
      key: 'actions',
      width: 170,
      render: (_: any, r: RetargetCandidate) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<Send size={12} />}
            style={{
              background: '#047857',
              borderColor: '#047857',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onClick={() => handleSendWhatsApp(r)}
          >
            إرسال فوري
          </Button>
          <Tooltip title="معاينة وتخصيص نص الرسالة">
            <Button
              size="small"
              icon={<MessageSquare size={12} />}
              onClick={() => handleOpenPreview(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          borderRadius: 14,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(4, 120, 87, 0.25)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="center" size={14}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  محرك إعادة الاستهداف وتذكير الدورات التجميلية (Smart WhatsApp Retargeting)
                </Title>
                <Text style={{ color: '#d1fae5', fontSize: 13 }}>
                  تتبع آلي لدورات البوتوكس (4-6 شهور)، فترات الليزر (4 أسابيع)، هيدرافيشل النضارة الشهري، واستعادة العميلات الغائبات
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'start' }}>
            <Button
              type="primary"
              size="large"
              icon={<Send size={16} />}
              style={{
                backgroundColor: '#ffffff',
                color: '#064e3b',
                borderColor: '#ffffff',
                fontWeight: 700,
                borderRadius: 8,
              }}
              onClick={() => {
                const pendings = candidates.filter((c) => c.contactStatus === 'pending');
                if (pendings.length === 0) {
                  message.info('جميع العميلات تم التواصل معهن بالفعل!');
                  return;
                }
                handleOpenPreview(pendings[0]);
              }}
            >
              بدء حملة إعادة التنشيط ({metrics.pendingCount})
            </Button>
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #fed7aa', background: '#fffbeb' }}>
            <Space align="center" size={10}>
              <Clock size={22} color="#ea580c" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>عميلات بانتظار التذكير</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>
                  {metrics.pendingCount} عميلة
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
            <Space align="center" size={10}>
              <Send size={22} color="#2563eb" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>تم إرسال تذكير واتساب</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>
                  {metrics.sentCount} رسالة
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
            <Space align="center" size={10}>
              <CheckCircle size={22} color="#047857" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>تم إعادة الحجز بنجاح</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#047857' }}>
                  {metrics.rebookedCount} جلسة جديدة
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #fbcfe8', background: '#fdf2f8' }}>
            <Space align="center" size={10}>
              <Sparkles size={22} color="#be185d" />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>الإيراد التقديري المستعاد</Text>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#be185d' }}>
                  {metrics.estimatedRecoveredEgp.toLocaleString()} ج.م
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filter and Category Switcher */}
      <Card size="small" style={{ borderRadius: 10 }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} md={14}>
            <Segmented
              value={activeCategory}
              onChange={(val) => setActiveCategory(val as any)}
              options={[
                { value: 'all', label: `الكل (${candidates.length})` },
                { value: 'botox', label: '💉 تجديد بوتوكس وفيلر (3-6 شهور)' },
                { value: 'laser', label: '⚡ موعد الليزر التالي (4 أسابيع)' },
                { value: 'skincare', label: '✨ هيدرافيشل ونضارة شهرية' },
                { value: 'winback', label: '🌸 عميلات غائبات (60+ يوم)' },
              ]}
            />
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'start' }}>
            <Space wrap>
              <Input
                placeholder="بحث بالاسم أو الهاتف..."
                prefix={<Search size={14} color="#94a3b8" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 170 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 130 }}
                options={[
                  { value: 'all', label: 'كل الحالات' },
                  { value: 'pending', label: '⏳ معلق' },
                  { value: 'sent', label: '📲 تم الإرسال' },
                  { value: 'rebooked', label: '✅ تم الحجز' },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Candidates Table */}
      <Card size="small" style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredCandidates}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal: Preview & Customize WhatsApp Message */}
      <Modal
        title={
          <Space>
            <MessageSquare size={18} color="#047857" />
            <span style={{ fontWeight: 700 }}>معاينة وتخصيص رسالة الواتساب — {selectedCandidate?.name}</span>
          </Space>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        width={580}
        footer={[
          <Button key="cancel" onClick={() => setPreviewModalOpen(false)}>إلغاء</Button>,
          <Button
            key="send"
            type="primary"
            icon={<ExternalLink size={14} />}
            style={{ background: '#047857', borderColor: '#047857', fontWeight: 700 }}
            onClick={() => {
              if (selectedCandidate) {
                handleSendWhatsApp(selectedCandidate, messageBody);
                setPreviewModalOpen(false);
              }
            }}
          >
            فتح واتساب وإرسال الرسالة
          </Button>,
        ]}
      >
        {selectedCandidate && (
          <div>
            <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <Row gutter={12}>
                <Col span={12}>
                  <div>👤 <strong>العميلة:</strong> {selectedCandidate.name} ({selectedCandidate.phone})</div>
                  <div style={{ marginTop: 4 }}>👨‍⚕️ <strong>الطبيبة:</strong> {selectedCandidate.doctor}</div>
                </Col>
                <Col span={12}>
                  <div>⚡ <strong>الإجراء السابق:</strong> {selectedCandidate.lastProcedure}</div>
                  <div style={{ marginTop: 4 }}>⏳ <strong>المدة:</strong> {selectedCandidate.daysSinceLastVisit} يوماً مضت</div>
                </Col>
              </Row>
            </div>

            <Text strong style={{ display: 'block', marginBottom: 6 }}>نص الرسالة المقترح (يمكنك التعديل والإضافة بحرية):</Text>
            <Input.TextArea
              rows={8}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              style={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13, borderRadius: 8 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
