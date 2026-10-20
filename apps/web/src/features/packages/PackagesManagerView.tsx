import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Table,
  Space,
  Progress,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tabs,
  Checkbox,
} from 'antd';
import {
  Ticket,
  Plus,
  Trash2,
  Edit3,
  User,
  Layers,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  getClinicPackages,
  saveClinicPackage,
  deleteClinicPackage,
  subscribeToPackages,
  AVAILABLE_PACKAGE_SERVICES,
  ClinicPackage,
  ClientPackageEnrollment,
  getClientPackageEnrollments,
  saveClientPackageEnrollments,
  subscribeToPackageEnrollments,
} from '../../lib/packagesDirectory';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';

const { Title, Text } = Typography;

export function PackagesManagerView() {
  const [templates, setTemplates] = useState<ClinicPackage[]>(getClinicPackages);
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);
  const [enrollments, setEnrollments] = useState<ClientPackageEnrollment[]>(getClientPackageEnrollments);

  useEffect(() => {
    const unsub = subscribeToPackages(() => {
      setTemplates(getClinicPackages());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubEnr = subscribeToPackageEnrollments(() => {
      setEnrollments(getClientPackageEnrollments());
    });
    return () => unsubEnr();
  }, []);

  const [activeTab, setActiveTab] = useState<'enrollments' | 'templates'>('enrollments');

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ClinicPackage | null>(null);
  const [templateForm] = Form.useForm();

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm] = Form.useForm();

  const saveEnrollments = (next: ClientPackageEnrollment[]) => {
    setEnrollments(next);
    saveClientPackageEnrollments(next);
  };

  // Redeem 1 session credit
  const handleRedeem = (id: string) => {
    const next = enrollments.map((enr) => {
      if (enr.id === id) {
        if (enr.remainingSessions <= 0) {
          message.warning('تم استهلاك جميع جلسات هذه الباقة!');
          return enr;
        }
        const nextCompleted = enr.completedSessions + 1;
        const nextRemaining = enr.remainingSessions - 1;
        message.success(`تم خصم جلسة بنجاح للحالة: ${enr.patientName} (متبقي ${nextRemaining} جلسات)`);
        return {
          ...enr,
          completedSessions: nextCompleted,
          remainingSessions: nextRemaining,
          status: nextRemaining === 0 ? ('مكتملة' as const) : ('نشطة' as const),
        };
      }
      return enr;
    });
    saveEnrollments(next);
  };

  // Add/Edit Template
  const handleSaveTemplate = (values: any) => {
    const includedList: string[] = Array.isArray(values.includedServices)
      ? values.includedServices
      : typeof values.includedServices === 'string'
      ? values.includedServices.split(' + ')
      : [];

    const pkg: ClinicPackage = {
      id: editingTemplate ? editingTemplate.id : `pkg-${Date.now()}`,
      name: values.name,
      category: values.category,
      totalSessions: Number(values.totalSessions),
      priceEgp: Number(values.priceEgp),
      includedServices: includedList,
      validityMonths: Number(values.validityMonths) || 12,
      notes: values.notes || '',
    };

    saveClinicPackage(pkg);
    setTemplates(getClinicPackages());
    message.success('✅ تم حفظ وتحديث الباقة بنجاح ومشاركتها مع الحجوزات والفواتير والعيادات!');
    setIsTemplateModalOpen(false);
    templateForm.resetFields();
  };

  const handleDeleteTemplate = (id: string) => {
    deleteClinicPackage(id);
    setTemplates(getClinicPackages());
    message.success('تم حذف الباقة من دليل العيادة');
  };

  // Enroll Client
  const handleSaveEnrollment = (values: any) => {
    const total = values.totalSessions || 6;
    const newEnr: ClientPackageEnrollment = {
      id: `enr-${Date.now()}`,
      patientName: values.patientName,
      patientId: values.patientId || `PAT-00${Math.floor(Math.random() * 900) + 100}`,
      patientPhone: values.patientPhone || '',
      packageName: values.packageName,
      category: values.category || 'باكدج مخصص',
      totalSessions: total,
      completedSessions: 0,
      remainingSessions: total,
      priceEgp: values.priceEgp,
      paymentStatus: values.paymentStatus || 'مدفوع بالكامل',
      paidAmountEgp: values.paidAmountEgp || values.priceEgp,
      purchaseDate: dayjs().format('YYYY-MM-DD'),
      expiryDate: dayjs().add(values.validityMonths || 12, 'month').format('YYYY-MM-DD'),
      status: 'نشطة',
    };
    saveEnrollments([newEnr, ...enrollments]);
    message.success(`تم اشتراك الحالة ${newEnr.patientName} في الباقة بنجاح!`);
    setIsEnrollModalOpen(false);
    enrollForm.resetFields();
  };

  const enrollmentColumns = [
    {
      title: 'الحالة / العميلة',
      key: 'patient',
      render: (_: any, r: ClientPackageEnrollment) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.patientId} {r.patientPhone && `• ${r.patientPhone}`}</Text>
        </div>
      ),
    },
    {
      title: 'اسم الباقة ومحتواها',
      key: 'package',
      render: (_: any, r: ClientPackageEnrollment) => (
        <div>
          <div style={{ fontWeight: 600, color: '#334155' }}>{r.packageName}</div>
          <Tag color="magenta" style={{ marginTop: 2 }}>{r.category}</Tag>
          <Tag color={r.status === 'نشطة' ? 'green' : 'default'}>{r.status}</Tag>
        </div>
      ),
    },
    {
      title: 'رصيد الجلسات',
      key: 'sessions',
      width: 220,
      render: (_: any, r: ClientPackageEnrollment) => {
        const percent = Math.round((r.completedSessions / r.totalSessions) * 100);
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span>تم: <strong style={{ color: '#0F172A' }}>{r.completedSessions}</strong> من {r.totalSessions}</span>
              <strong style={{ color: r.remainingSessions > 0 ? '#be185d' : '#059669' }}>
                متبقي {r.remainingSessions} جلسات
              </strong>
            </div>
            <Progress percent={percent} size="small" strokeColor={r.remainingSessions > 0 ? '#be185d' : '#059669'} />
          </div>
        );
      },
    },
    {
      title: 'السعر والسداد',
      key: 'price',
      width: 170,
      render: (_: any, r: ClientPackageEnrollment) => (
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: '#059669' }}>{r.priceEgp.toLocaleString()} ج.م</div>
          <Tag color={r.paymentStatus === 'مدفوع بالكامل' ? 'blue' : 'orange'} style={{ fontSize: 11, marginTop: 2 }}>
            {r.paymentStatus}
          </Tag>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            صلاحية حتى: {dayjs(r.expiryDate).format('YYYY/MM/DD')}
          </div>
        </div>
      ),
    },
    {
      title: 'خصم جلسة',
      key: 'redeem',
      width: 140,
      render: (_: any, r: ClientPackageEnrollment) => (
        <Popconfirm
          title="خصم جلسة واحدة؟"
          description={`هل حضرت الحالة ${r.patientName} للجلسة وتريدين خصم 1 من الرصيد؟`}
          onConfirm={() => handleRedeem(r.id)}
          disabled={r.remainingSessions <= 0}
          okText="نعم، خصم"
          cancelText="إلغاء"
        >
          <Button
            type="primary"
            size="small"
            disabled={r.remainingSessions <= 0}
            style={{
              backgroundColor: r.remainingSessions > 0 ? '#be185d' : undefined,
              borderColor: r.remainingSessions > 0 ? '#be185d' : undefined,
              fontWeight: 600,
              borderRadius: 6,
            }}
          >
            خصم 1 جلسة
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const templateColumns = [
    {
      title: 'اسم الباقة',
      key: 'name',
      render: (_: any, r: ClinicPackage) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Array.isArray(r.includedServices) ? (
              r.includedServices.map((item) => (
                <Tag color="cyan" key={item} style={{ fontSize: 11, margin: 0 }}>
                  {item}
                </Tag>
              ))
            ) : (
              <span>🎁 <strong>المحتوى:</strong> {r.includedServices}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'التصنيف',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      render: (c: string) => <Tag color="purple">{c}</Tag>,
    },
    {
      title: 'عدد الجلسات',
      dataIndex: 'totalSessions',
      key: 'sessions',
      width: 120,
      render: (s: number) => <span style={{ fontWeight: 600 }}>{s} جلسات</span>,
    },
    {
      title: 'السعر المحدد للعيادة',
      dataIndex: 'priceEgp',
      key: 'price',
      width: 160,
      render: (p: number) => <span style={{ fontWeight: 700, color: '#be185d', fontSize: 15 }}>{p.toLocaleString()} ج.م</span>,
    },
    {
      title: 'الصلاحية',
      dataIndex: 'validityMonths',
      key: 'validity',
      width: 110,
      render: (m: number) => <span>{m} شهر</span>,
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 100,
      render: (_: any, r: ClinicPackage) => (
        <Space size={4}>
          <Button
            size="small"
            type="text"
            icon={<Edit3 size={14} />}
            onClick={() => {
              setEditingTemplate(r);
              const inc = Array.isArray(r.includedServices)
                ? r.includedServices
                : typeof r.includedServices === 'string'
                ? (r.includedServices as string).split(' + ')
                : [];
              templateForm.setFieldsValue({
                ...r,
                includedServices: inc,
              });
              setIsTemplateModalOpen(true);
            }}
          />
          <Popconfirm title="حذف هذه الباقة من دليل العيادة؟" onConfirm={() => handleDeleteTemplate(r.id)} okText="نعم" cancelText="إلغاء">
            <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Luxury Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 16,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
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
                <Ticket size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  إدارة الباقات وعروض الجلسات المخصصة
                </Title>
                <Text style={{ color: '#e0e7ff', fontSize: 13 }}>
                  العيادة تحدد أسعار الباقات والخدمات التي بداخلها بحرية تامة، مع اشتراك الحالات وتتبع خصم الجلسات المتبقية بنقرة واحدة
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
                  color: '#312e81',
                  borderColor: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                }}
                onClick={() => {
                  setEditingTemplate(null);
                  templateForm.resetFields();
                  setIsTemplateModalOpen(true);
                }}
              >
                + تصميم باقة جديدة للعيادة
              </Button>
              <Button
                size="large"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.4)',
                  fontWeight: 600,
                  borderRadius: 10,
                }}
                onClick={() => {
                  enrollForm.resetFields();
                  setIsEnrollModalOpen(true);
                }}
              >
                اشتراك حالة في باقة
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Switcher Tabs */}
      <Card style={{ borderRadius: 14, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          items={[
            {
              key: 'enrollments',
              label: (
                <Space>
                  <User size={15} />
                  <span style={{ fontWeight: 600 }}>اشتراكات الحالات وأرصدة الجلسات ({enrollments.length})</span>
                </Space>
              ),
              children: (
                <Table
                  dataSource={enrollments}
                  rowKey="id"
                  columns={enrollmentColumns}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: 800 }}
                />
              ),
            },
            {
              key: 'templates',
              label: (
                <Space>
                  <Layers size={15} />
                  <span style={{ fontWeight: 600 }}>دليل وتسعير باقات العيادة المعتمدة ({templates.length})</span>
                </Space>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      يمكنكِ إضافة أي باقة جديدة وتحديد محتواها وسعرها وعدد جلساتها بما يناسب عروض عيادتكِ
                    </Text>
                    <Button
                      type="dashed"
                      icon={<Plus size={14} />}
                      onClick={() => {
                        setEditingTemplate(null);
                        templateForm.resetFields();
                        setIsTemplateModalOpen(true);
                      }}
                    >
                      إضافة باقة جديدة
                    </Button>
                  </div>
                  <Table
                    dataSource={templates}
                    rowKey="id"
                    columns={templateColumns}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 750 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal: Design/Edit Package Template */}
      <Modal
        title={editingTemplate ? 'تعديل تفاصيل باقة العيادة' : 'تصميم باقة عروض جديدة للعيادة'}
        open={isTemplateModalOpen}
        onCancel={() => { setIsTemplateModalOpen(false); templateForm.resetFields(); }}
        onOk={() => templateForm.submit()}
        okText={editingTemplate ? 'حفظ التعديلات' : 'إنشاء الباقة'}
        cancelText="إلغاء"
        width={620}
      >
        <Form form={templateForm} layout="vertical" onFinish={handleSaveTemplate}>
          <Form.Item name="name" label="اسم الباقة" rules={[{ required: true, message: 'مطلوب كتابة اسم الباقة' }]}>
            <Input placeholder="مثال: باكدج ليزر كانديلا كامل الجسم / باكدج نضارة البشرة" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="التصنيف" initialValue="ليزر وإزالة شعر" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'ليزر وإزالة شعر', label: 'ليزر وإزالة شعر' },
                    { value: 'عناية بالبشرة', label: 'عناية بالبشرة وهيدرافيشل' },
                    { value: 'حقن وبوتوكس وفيلر', label: 'حقن وبوتوكس وفيلر' },
                    { value: 'سبا ومساج وحمام مغربي', label: 'سبا ومساج وحمام مغربي' },
                    { value: 'باكدج ميكس شامل', label: 'باكدج ميكس شامل / باكدج عروسة' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="totalSessions" label="عدد الجلسات" initialValue={6} rules={[{ required: true }]}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="priceEgp" label="سعر الباقة (ج.م)" rules={[{ required: true, message: 'حددي السعر' }]}>
                <InputNumber min={0} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="includedServices"
            label="الخدمات والمناطق المشمولة داخل الباقة (حددي الخدمات عبر الاختيار السريع)"
            rules={[{ required: true, message: 'حددي ما تشمله الباقة' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: 12,
                  background: '#f8fafc',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px 12px',
                }}
              >
                {AVAILABLE_PACKAGE_SERVICES.map((srv) => (
                  <Checkbox key={srv} value={srv} style={{ fontSize: 13, marginRight: 0 }}>
                    {srv}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="validityMonths" label="مدة الصلاحية للاستهلاك (بالشهور)" initialValue={12}>
                <Select
                  options={[
                    { value: 3, label: '3 شهور' },
                    { value: 6, label: '6 شهور' },
                    { value: 12, label: '12 شهر (سنة كاملة)' },
                    { value: 18, label: '18 شهر' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="ملاحظات وشروط خاصة">
                <Input placeholder="مثال: لا تقبل التحويل لشخص آخر" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal: Enroll Client in Package */}
      <Modal
        title="اشتراك حالة في باقة جلسات"
        open={isEnrollModalOpen}
        onCancel={() => { setIsEnrollModalOpen(false); enrollForm.resetFields(); }}
        onOk={() => enrollForm.submit()}
        okText="تسجيل الاشتراك وفتح الرصيد"
        cancelText="إلغاء"
        width={620}
      >
        <Form form={enrollForm} layout="vertical" onFinish={handleSaveEnrollment}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="patientName" label="اسم الحالة / العميلة" rules={[{ required: true, message: 'مطلوب' }]}>
                <Select
                  showSearch
                  placeholder="ابحثي بالاسم أو رقم الهاتف..."
                  optionFilterProp="label"
                  onChange={(val) => {
                    const found = registeredPatients.find((p) => p.name === val);
                    if (found) {
                      enrollForm.setFieldsValue({
                        patientPhone: found.phone,
                        patientId: found.id,
                      });
                    }
                  }}
                  options={registeredPatients.map((p) => ({
                    value: p.name,
                    label: `${p.name} (${p.phone})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="patientPhone" label="رقم الموبايل (للواتساب)">
                <Input placeholder="01xxxxxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="packageName" label="اختيار الباقة من الدليل" rules={[{ required: true, message: 'اختاري الباقة' }]}>
            <Select
              placeholder="اختاري الباقة المتاحة"
              onChange={(val) => {
                const found = templates.find((t) => t.name === val);
                if (found) {
                  enrollForm.setFieldsValue({
                    category: found.category,
                    totalSessions: found.totalSessions,
                    priceEgp: found.priceEgp,
                    paidAmountEgp: found.priceEgp,
                  });
                }
              }}
              options={templates.map((t) => ({
                value: t.name,
                label: `${t.name} — (${t.totalSessions} جلسات بـ ${t.priceEgp.toLocaleString()} ج.م)`,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="totalSessions" label="إجمالي الجلسات" initialValue={6}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priceEgp" label="إجمالي السعر (ج.م)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paidAmountEgp" label="المبلغ المدفوع حالياً">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentStatus" label="حالة السداد" initialValue="مدفوع بالكامل">
                <Select
                  options={[
                    { value: 'مدفوع بالكامل', label: 'مدفوع بالكامل' },
                    { value: 'تقسيط / دفعة مقدمة', label: 'تقسيط / دفعة مقدمة' },
                    { value: 'معلق', label: 'معلق بالخزينة' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validityMonths" label="مدة الصلاحية (بالشهور)" initialValue={12}>
                <Select
                  options={[
                    { value: 6, label: '6 شهور' },
                    { value: 12, label: '12 شهر' },
                    { value: 18, label: '18 شهر' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
