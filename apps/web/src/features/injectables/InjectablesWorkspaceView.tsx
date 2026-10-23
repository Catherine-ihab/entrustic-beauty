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
  Checkbox,
} from 'antd';
import {
  Syringe,
  AlertTriangle,
  History,
  CheckCircle2,
  Sparkles,
  Plus,
  FileCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useLang } from '../../lib/useLang';
import { getRegisteredPatients, RegisteredPatient } from '../../lib/patientsDirectory';
import { QueueBanner } from '../../components/QueueBanner';
import { QueueEntry, finishQueueSessionByPatient } from '../../lib/clinicQueue';
import { consumeInventoryStock } from '../../lib/clinicInventory';
import { recordDoctorSessionEarning } from '../../lib/doctorEarnings';
import { redeemPackageSessionForPatient } from '../../lib/packagesDirectory';

const { Title, Text } = Typography;

export interface InjectableTreatment {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  category: 'Neurotoxin' | 'Dermal Filler' | 'Biostimulator';
  productName: string;
  lotNumber: string;
  expiryDate: string;
  targetArea: string;
  totalDosage: string; // e.g. "34 Units" or "1.0 mL"
  technique: string; // e.g. "30G Needle / 4 injection points" or "25G 50mm Cannula"
  practitioner: string;
  consentSigned: boolean;
  notes: string;
}

export const InjectablesWorkspaceView: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('Botox Cosmetic (Allergan)');
  const [lotNumber, setLotNumber] = useState<string>('C38491-02');
  const [expiryDate, setExpiryDate] = useState<string>('2027-08-30');
  const [reconstitution, setReconstitution] = useState<string>('2.5 mL 0.9% NaCl (4U per 0.1 mL)');

  // Facial zone dosage distribution
  const [dosages, setDosages] = useState<{ [zone: string]: number }>({
    glabella: 20,
    frontalis: 10,
    crowsFeet: 12,
    bunnyLines: 4,
    masseter: 0,
    lipFlip: 0,
    daos: 0,
    mentalis: 4,
  });

  const totalCalculatedUnits = Object.values(dosages).reduce((acc, curr) => acc + curr, 0);

  // Vascular occlusion emergency protocol verification
  const [emergencyProtocolChecked, setEmergencyProtocolChecked] = useState(true);
  const [consentVerified, setConsentVerified] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [registeredPatients] = useState<RegisteredPatient[]>(getRegisteredPatients);
  const [isManualPatient, setIsManualPatient] = useState(false);

  const { tx } = useLang();

  const LS_INJECTABLES_KEY = 'clinic_injectables_sessions_v2';
  const DEFAULT_TREATMENTS: InjectableTreatment[] = [
    {
      id: 'inj-01',
      date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
      patientName: 'نوران مصطفى',
      patientId: 'PAT-00042',
      category: 'Neurotoxin',
      productName: 'Botox Cosmetic (Allergan)',
      lotNumber: 'C38491-02',
      expiryDate: '2027-08-30',
      targetArea: 'Upper Face (Glabella 20U + Frontalis 10U)',
      totalDosage: '30 Units',
      technique: '32G Nano-needle / 5 points Glabella, 4 points Frontalis',
      practitioner: 'Dr. Heba Ramadan',
      consentSigned: true,
      notes: 'No bruising. Patient instructed not to lie down for 4 hours and avoid intense gym sessions for 24h.',
    },
    {
      id: 'inj-02',
      date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'),
      patientName: 'Farida Sabry',
      patientId: 'PAT-00089',
      category: 'Dermal Filler',
      productName: 'Juvederm Ultra 4 (Allergan)',
      lotNumber: 'JV4-88301',
      expiryDate: '2027-03-15',
      targetArea: 'Nasolabial Folds & Marionette Lines',
      totalDosage: '1.0 mL (1 syringe)',
      technique: '25G 50mm TSK Cannula / Deep subcutaneous bolus and retrograde linear threading',
      practitioner: 'Dr. Mariam Farouk',
      consentSigned: true,
      notes: 'Capillary refill time < 1.5s verified bilaterally. Hyaluronidase protocol ready on-site.',
    },
    {
      id: 'inj-03',
      date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
      patientName: 'Heba Amin',
      patientId: 'PAT-00115',
      category: 'Dermal Filler',
      productName: 'Restylane Kysse (Galderma)',
      lotNumber: 'KYS-77210',
      expiryDate: '2026-11-20',
      targetArea: 'Lip Vermilion Border & Body',
      totalDosage: '1.0 mL',
      technique: '30G Needle / Micro-droplet contouring',
      practitioner: 'Dr. Heba Ramadan',
      consentSigned: true,
      notes: 'Cold compress applied immediately. Mild anticipated swelling. Post-care instructions dispatched via WhatsApp.',
    },
  ];

  const [treatments, setTreatments] = useState<InjectableTreatment[]>(() => {
    try {
      const raw = localStorage.getItem(LS_INJECTABLES_KEY) || localStorage.getItem('injectables_sessions_history_v2');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_TREATMENTS;
  });

  const saveTreatments = (next: InjectableTreatment[]) => {
    setTreatments(next);
    localStorage.setItem(LS_INJECTABLES_KEY, JSON.stringify(next));
    localStorage.setItem('injectables_sessions_history_v2', JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSaveTreatment = (values: any) => {
    const isFiller = values.category === 'Dermal Filler';
    const isBio = values.category === 'Biostimulator';
    
    const areas = Array.isArray(values.targetArea)
      ? values.targetArea.join(' + ')
      : (values.targetArea || tx('منطقة الوجه', 'Facial Zone'));

    let formattedDosage = '';
    if (values.dosage) {
      formattedDosage = isFiller || isBio ? `${values.dosage} mL` : `${values.dosage} Units`;
    } else {
      formattedDosage = isFiller ? '1.0 mL' : isBio ? '1.5 mL' : `${totalCalculatedUnits || 20} Units`;
    }

    const newRecord: InjectableTreatment = {
      id: `inj-${Date.now()}`,
      date: dayjs().format('YYYY-MM-DD'),
      patientName: values.patientName || 'حالة مسجلة',
      patientId: values.patientId || 'PAT-00160',
      category: values.category || 'Neurotoxin',
      productName: values.productName || selectedProduct,
      lotNumber: values.lotNumber || lotNumber,
      expiryDate: values.expiryDate || expiryDate,
      targetArea: areas,
      totalDosage: formattedDosage,
      technique: values.technique || '32G 4mm Nano-needle',
      practitioner: values.practitioner || 'د. هبة رمضان',
      consentSigned: consentVerified,
      notes: values.notes || 'جلسة علاجية ممتازة وتوزيع متناسق بدون كدمات.',
    };

    saveTreatments([newRecord, ...treatments]);

    // 1. Deduct vial/syringe from clinic inventory (idempotent with session ID)
    consumeInventoryStock(newRecord.productName, 1, newRecord.patientName, newRecord.id, `حقن: ${newRecord.targetArea}`);

    // 2. Automatically record Doctor Commission / Earning (idempotent)
    recordDoctorSessionEarning({
      sessionRefId: newRecord.id,
      doctorName: newRecord.practitioner,
      patientId: newRecord.patientId,
      patientName: newRecord.patientName,
      serviceName: `حقن ${newRecord.productName} (${newRecord.targetArea})`,
      serviceCategory: 'بوتوكس وفيلر',
      servicePriceEgp: Number(values.servicePriceEgp) || (isFiller ? 3500 : 2500),
      date: newRecord.date,
      notes: `${newRecord.totalDosage} — تشغيلة: ${newRecord.lotNumber}`,
    });

    // 3. Deduct/Redeem package session credit if patient has active package
    const redeemRes = redeemPackageSessionForPatient(newRecord.patientName, 'حقن وبوتوكس وفيلر');
    if (redeemRes.success) {
      message.info(`🎟️ ${redeemRes.message}`);
    }

    // 4. Mark completed in daily queue
    finishQueueSessionByPatient(newRecord.patientName, newRecord.notes);

    message.success(tx('✅ تم توثيق جلسة الحقن، واحتساب مستحقات الطبيب، وتحديث الباقات والمخزن!', 'Injectable Treatment Logged, Commission Calculated & Inventory Deducted!'));
    setModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: tx('التاريخ والفئة', 'Date & Category'),
      key: 'date',
      width: 140,
      render: (_: any, r: InjectableTreatment) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{dayjs(r.date).format('YYYY/MM/DD')}</Text>
          <Tag color={r.category === 'Neurotoxin' ? 'purple' : 'magenta'}>
            {r.category === 'Neurotoxin' ? tx('بوتوكس', 'Neurotoxin') : r.category === 'Dermal Filler' ? tx('فيلر', 'Dermal Filler') : tx('محفز كولاجين', 'Biostimulator')}
          </Tag>
        </Space>
      ),
    },
    {
      title: tx('الحالة / العميلة', 'Patient'),
      key: 'patient',
      render: (_: any, r: InjectableTreatment) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.patientId}</Text>
        </div>
      ),
    },
    {
      title: tx('المنتج ورقم التشغيلة', 'Product & Lot Traceability'),
      key: 'product',
      render: (_: any, r: InjectableTreatment) => (
        <div>
          <div style={{ fontWeight: 500, color: '#be185d' }}>{r.productName}</div>
          <Space size={6} style={{ fontSize: 11, color: '#64748B' }}>
            <span>{tx('تشغيلة:', 'Lot:')} <Text code>{r.lotNumber}</Text></span>
            <span>{tx('صلاحية:', 'Exp:')} {r.expiryDate}</span>
          </Space>
        </div>
      ),
    },
    {
      title: tx('المنطقة والجرعة', 'Area & Dosage'),
      key: 'dosage',
      render: (_: any, r: InjectableTreatment) => (
        <div>
          <Text strong>{r.totalDosage}</Text>
          <div style={{ fontSize: 12, color: '#475569' }}>{r.targetArea}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{r.technique}</div>
        </div>
      ),
    },
    {
      title: tx('الموافقة والسلامة', 'Safety / Consent'),
      key: 'consent',
      width: 130,
      render: (_: any, r: InjectableTreatment) =>
        r.consentSigned ? (
          <Tag icon={<CheckCircle2 size={12} />} color="success">
            {tx('موافقة موقعة', 'Consent Signed')}
          </Tag>
        ) : (
          <Tag color="error">{tx('معلقة', 'Pending')}</Tag>
        ),
    },
    {
      title: tx('الطبيبة / الممارس', 'Practitioner'),
      dataIndex: 'practitioner',
      key: 'practitioner',
      render: (p: string) => <span style={{ fontSize: 12 }}>{p}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #be185d 100%)',
          borderRadius: 14,
          border: 'none',
          color: '#ffffff',
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
                <Syringe size={24} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {tx('منظومة حقن البوتوكس والفيلر السريرية', 'Botox & Injectables Clinical Workspace')}
                </Title>
                <Text style={{ color: '#fce7f3', fontSize: 13 }}>
                  {tx('توزيع جرعات الوجه الدقيقة، وتتبع أرقام التشغيلات (Lot Numbers)، وبروتوكولات السلامة الوعائية والتذويب', 'Precision facial mapping, batch/lot traceability, reconstitution protocols & vascular safety compliance')}
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
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onClick={() => setModalVisible(true)}
            >
              {tx('+ توثيق جلسة حقن جديدة', 'Document Injection Procedure')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Delay-Tolerant Synchronized Queue Banner */}
      <QueueBanner
        workspaceCategory="injectables"
        onSelectPatient={(q: QueueEntry) => {
          form.setFieldsValue({
            patientName: q.patientName,
            patientId: q.patientNumber || q.patientId,
            notes: q.packageName || q.serviceName,
          });
          setModalVisible(true);
        }}
      />

      {/* Main Workspace Layout */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Product Selection & Facial Dose Calculator */}
        <Col xs={24} lg={10}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Product & Lot Traceability Card */}
            <Card
              size="small"
              title={
                <Space>
                  <FileCheck size={16} color="#db2777" />
                  <span style={{ fontWeight: 600 }}>{tx('1. سجل تتبع المنتج والتشغيلة (Lot Traceability)', '1. Product & Lot Traceability Registry')}</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <Text strong style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    {tx('مستحضر الحقن المستخدم:', 'Injectable Product Formulation:')}
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={selectedProduct}
                    onChange={(val) => {
                      setSelectedProduct(val);
                      if (val.includes('Juvederm')) {
                        setLotNumber('JV4-88301');
                        setExpiryDate('2027-03-15');
                      } else if (val.includes('Restylane')) {
                        setLotNumber('KYS-77210');
                        setExpiryDate('2026-11-20');
                      } else {
                        setLotNumber('C38491-02');
                        setExpiryDate('2027-08-30');
                      }
                    }}
                    options={[
                      { value: 'Botox Cosmetic (Allergan 100U)', label: 'Botox Cosmetic 100U (OnabotulinumtoxinA)' },
                      { value: 'Dysport (Galderma 300U)', label: 'Dysport 300U (AbobotulinumtoxinA)' },
                      { value: 'Xeomin (Merz 100U)', label: 'Xeomin 100U (IncobotulinumtoxinA)' },
                      { value: 'Juvederm Ultra 4 (Allergan 2x1mL)', label: 'Juvederm Ultra 4 (HA 24mg/mL + Lidocaine)' },
                      { value: 'Juvederm Voluma XC (Allergan 2x1mL)', label: 'Juvederm Voluma XC (HA 20mg/mL Deep)' },
                      { value: 'Restylane Kysse (Galderma 1mL)', label: 'Restylane Kysse (OBT Lip Filler)' },
                      { value: 'Radiesse (Merz 1.5mL)', label: 'Radiesse (Calcium Hydroxylapatite CaHA)' },
                    ]}
                  />
                </div>

                <Row gutter={12}>
                  <Col span={12}>
                    <Text strong style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                      {tx('رقم التشغيلة (Batch Lot #):', 'Vial / Box Batch Lot #:')}
                    </Text>
                    <Input
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                      {tx('تاريخ انتهاء الصلاحية:', 'Manufacturer Expiration:')}
                    </Text>
                    <Input
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </Col>
                </Row>

                <div>
                  <Text strong style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                    {tx('نسبة التخفيف وحل البودرة (للتوكسين):', 'Reconstitution Dilution Ratio (If Toxin):')}
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={reconstitution}
                    onChange={setReconstitution}
                    options={[
                      { value: '2.5 mL 0.9% NaCl (4U per 0.1 mL)', label: '2.5 mL 0.9% Bacteriostatic NaCl (4U / 0.1 mL)' },
                      { value: '2.0 mL 0.9% NaCl (5U per 0.1 mL)', label: '2.0 mL 0.9% Bacteriostatic NaCl (5U / 0.1 mL)' },
                      { value: '1.0 mL 0.9% NaCl (10U per 0.1 mL)', label: '1.0 mL 0.9% Bacteriostatic NaCl (10U / 0.1 mL - Hyperconcentrated)' },
                      { value: 'Pre-filled Syringe (Filler - No reconstitution)', label: tx('سرنجة جاهزة معبأة مسبقاً (فيلر)', 'Ready Pre-filled Syringe (Dermal Filler)') },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Facial Dose Distribution Matrix */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Sparkles size={16} color="#be185d" />
                    <span style={{ fontWeight: 600 }}>{tx('2. حساب الجرعات لمناطق الوجه التشريحية', '2. Facial Anatomical Unit Dosimetry')}</span>
                  </Space>
                  <Tag color="purple" style={{ fontWeight: 700 }}>
                    {tx(`الإجمالي: ${totalCalculatedUnits} وحدة`, `Total: ${totalCalculatedUnits} Units`)}
                  </Tag>
                </div>
              }
              style={{ borderRadius: 12 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row gutter={[12, 10]} align="middle">
                  <Col span={14}>
                    <Text strong style={{ fontSize: 12 }}>{tx('الجلابيلا وخطوط التكشيرة (Glabella):', 'Glabella (Procerus & Corrugator):')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{tx('خطوط ما بين الحاجبين (5 نقاط)', 'Frown lines (5 points)')}</Text>
                  </Col>
                  <Col span={10}>
                    <InputNumber
                      min={0}
                      max={40}
                      value={dosages.glabella}
                      onChange={(v) => setDosages({ ...dosages, glabella: v || 0 })}
                      addonAfter="U"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Row gutter={[12, 10]} align="middle">
                  <Col span={14}>
                    <Text strong style={{ fontSize: 12 }}>{tx('الجبهة (Frontalis):', 'Frontalis (Forehead Lines):')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{tx('الخطوط الأفقية (4-6 نقاط)', 'Horizontal lines (4-6 points)')}</Text>
                  </Col>
                  <Col span={10}>
                    <InputNumber
                      min={0}
                      max={30}
                      value={dosages.frontalis}
                      onChange={(v) => setDosages({ ...dosages, frontalis: v || 0 })}
                      addonAfter="U"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Row gutter={[12, 10]} align="middle">
                  <Col span={14}>
                    <Text strong style={{ fontSize: 12 }}>{tx('جانب العين (Crow\'s Feet):', 'Crow\'s Feet (Orbicularis Oculi):')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{tx('خطوط الابتسامة المحيطة بالعين (جانبين)', 'Periorbital lines (bilateral)')}</Text>
                  </Col>
                  <Col span={10}>
                    <InputNumber
                      min={0}
                      max={30}
                      value={dosages.crowsFeet}
                      onChange={(v) => setDosages({ ...dosages, crowsFeet: v || 0 })}
                      addonAfter="U"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Row gutter={[12, 10]} align="middle">
                  <Col span={14}>
                    <Text strong style={{ fontSize: 12 }}>{tx('خطوط الأرنب (Bunny Lines):', 'Bunny Lines (Nasalis):')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{tx('خطوط جسر الأنف', 'Nose bridge crinkling')}</Text>
                  </Col>
                  <Col span={10}>
                    <InputNumber
                      min={0}
                      max={12}
                      value={dosages.bunnyLines}
                      onChange={(v) => setDosages({ ...dosages, bunnyLines: v || 0 })}
                      addonAfter="U"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>

                <Row gutter={[12, 10]} align="middle">
                  <Col span={14}>
                    <Text strong style={{ fontSize: 12 }}>{tx('عضلة الفك / تنحيف الوجه (Masseter):', 'Masseter (Jaw Slimming / Bruxism):')}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{tx('25-35 وحدة لكل جانب', '25-35U per side')}</Text>
                  </Col>
                  <Col span={10}>
                    <InputNumber
                      min={0}
                      max={70}
                      value={dosages.masseter}
                      onChange={(v) => setDosages({ ...dosages, masseter: v || 0 })}
                      addonAfter="U"
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>
            </Card>

            {/* Vascular Occlusion & Emergency Protocol */}
            <Card
              size="small"
              title={
                <Space>
                  <AlertTriangle size={16} color="#B91C1C" />
                  <span style={{ fontWeight: 600, color: '#B91C1C' }}>{tx('بروتوكول السلامة والتدخل السريع', 'Safety & Emergency Protocol')}</span>
                </Space>
              }
              style={{ borderRadius: 12, border: '1px solid #fecaca', backgroundColor: '#fffbfb' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox
                  checked={emergencyProtocolChecked}
                  onChange={(e) => setEmergencyProtocolChecked(e.target.checked)}
                >
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {tx('حقيبة إنزيم الهيالورونيداز (Hyaluronidase 1500 IU) جاهزة ومفحوصة داخل الغرفة', 'Emergency Hyaluronidase 1500 IU kit inspected & ready in treatment room')}
                  </span>
                </Checkbox>
                <Checkbox
                  checked={consentVerified}
                  onChange={(e) => setConsentVerified(e.target.checked)}
                >
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {tx('تم توقيع إقرار الموافقة المستنيرة على الإجراء وموافقة التصوير', 'Signed Patient Informed Consent on file (with photo consent)')}
                  </span>
                </Checkbox>
              </Space>
            </Card>
          </div>
        </Col>

        {/* Right Column: Treatment History Ledger */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <History size={16} color="#be185d" />
                  <span style={{ fontWeight: 600 }}>{tx('سجل وجلسات حقن البوتوكس والفيلر', 'Injectables & Fillers Clinical Ledger')}</span>
                </Space>
                <Tag color="magenta">{tx(`${treatments.length} إجراء موثق`, `${treatments.length} Procedures Logged`)}</Tag>
              </div>
            }
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={treatments}
              rowKey="id"
              columns={columns}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 750 }}
            />
          </Card>

          {/* Clinical Post-Care Guidance */}
          <Card
            title={tx('تعليمات ما بعد الحقن للمريضة (إرسال تلقائي عبر واتساب)', 'Standard Post-Injection Care Checklist (Automated to WhatsApp)')}
            size="small"
            style={{ borderRadius: 12, marginTop: 16 }}
          >
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <div>✔️ <strong>{tx('الاستقامة وعدم الاستلقاء:', 'Maintain upright posture:')}</strong> {tx('عدم الاستلقاء أو الانحناء للأمام لمدة 4 ساعات.', 'Do not lie flat or bend over for 4 hours.')}</div>
                  <div>✔️ <strong>{tx('تجنب الرياضة الشاقة والحرارة:', 'No strenuous exercise:')}</strong> {tx('تجنب الجيم والساونا والمياه الساخنة لمدة 24-48 ساعة.', 'Avoid gym, saunas, and hot baths for 24-48 hours.')}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <div>✔️ <strong>{tx('جلسة الرتوش والمراجعة:', 'Touch-up review:')}</strong> {tx('مجدولة بعد 14 يوماً من جلسة الحقن.', 'Scheduled at day 14 (two weeks) post-injection.')}</div>
                  <div>✔️ <strong>{tx('مراقبة الأوعية الدموية:', 'Vascular watch:')}</strong> {tx('التواصل الفوري مع المركز في حال حدوث ألم غير معتاد أو شحوب بالجلد.', 'Immediate alert if severe pain or blanching occurs.')}</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Modal: Document Procedure */}
      <Modal
        title={
          <Space>
            <Syringe size={18} color="#be185d" />
            <span style={{ fontWeight: 700 }}>{tx('توثيق جلسة حقن تجميلي بالملف الطبي', 'Document Injectable Aesthetic Procedure')}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={740}
        okText={tx('حفظ الجلسة في الملف الطبي', 'Log into Medical Record')}
        cancelText={tx('إلغاء', 'Cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveTreatment}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="patientName"
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span>{tx('اسم الحالة / العميلة المسجلة بالعيادة', 'Registered Patient Name')}</span>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, fontSize: 11, color: '#be185d', fontWeight: 600 }}
                      onClick={() => {
                        setIsManualPatient(!isManualPatient);
                        form.setFieldsValue({ patientName: '', patientId: '' });
                      }}
                    >
                      {isManualPatient
                        ? tx('🔍 اختيار من الحالات المسجلة', '🔍 Search Registered')
                        : tx('✏️ كتابة حالة جديدة يدوياً', '✏️ Enter Manually')}
                    </Button>
                  </div>
                }
                rules={[{ required: true, message: tx('برجاء اختيار أو كتابة الاسم', 'Required') }]}
              >
                {isManualPatient ? (
                  <Input
                    placeholder={tx('مثال: سلمى إبراهيم', 'e.g. Salma Ibraheem')}
                    onChange={() => {
                      if (!form.getFieldValue('patientId')) {
                        form.setFieldsValue({
                          patientId: `PAT-${Math.floor(10000 + Math.random() * 90000)}`,
                        });
                      }
                    }}
                  />
                ) : (
                  <Select
                    showSearch
                    allowClear
                    placeholder={tx('ابحثي بالاسم أو رقم الهاتف...', 'Search by name or phone...')}
                    optionFilterProp="label"
                    onChange={(val, opt: any) => {
                      if (opt) {
                        form.setFieldsValue({
                          patientName: val,
                          patientId: opt.patientNumber || 'PAT-00104',
                        });
                      }
                    }}
                    options={registeredPatients.map((p) => ({
                      value: p.name,
                      label: `${p.name} — ${p.patientNumber} (${p.phone})`,
                      patientNumber: p.patientNumber,
                      phone: p.phone,
                    }))}
                  />
                )}
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="patientId"
                label={tx('رقم الملف الطبي / الكود', 'Patient MRN')}
                rules={[{ required: true, message: tx('مطلوب', 'Required') }]}
              >
                <Input placeholder="مثال: PAT-00104" style={{ backgroundColor: '#f8fafc', fontWeight: 600 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label={tx('نوع الإجراء', 'Category')} initialValue="Neurotoxin">
                <Select
                  options={[
                    { value: 'Neurotoxin', label: tx('بوتوكس (توكسين عصبي)', 'Botox / Neurotoxin') },
                    { value: 'Dermal Filler', label: tx('فيلر حمض هيالورونيك', 'Hyaluronic Acid Dermal Filler') },
                    { value: 'Biostimulator', label: tx('محفز كولاجين (Radiesse/Sculptra)', 'Biostimulator (Radiesse/Sculptra)') },
                    { value: 'Skin Booster', label: tx('سكين بوستر ونضارة (Profhilo)', 'Skin Booster (Profhilo)') },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="productName" label={tx('اسم المنتج والمصنع', 'Product Formulation & Brand')} initialValue={selectedProduct}>
                <Select
                  showSearch
                  options={[
                    { value: 'Botox Cosmetic (Allergan) - 100U', label: 'Botox Cosmetic (Allergan) - 100U' },
                    { value: 'Dysport (Galderma) - 300U / 500U', label: 'Dysport (Galderma) - 300U / 500U' },
                    { value: 'Xeomin (Merz) - 100U', label: 'Xeomin (Merz) - 100U' },
                    { value: 'Juvederm Ultra 4 (Allergan) - 1.0 mL', label: 'Juvederm Ultra 4 (Allergan) - 1.0 mL' },
                    { value: 'Juvederm Voluma XC (Allergan) - 1.0 mL', label: 'Juvederm Voluma XC (Allergan) - 1.0 mL' },
                    { value: 'Restylane Kysse (Galderma) - 1.0 mL', label: 'Restylane Kysse (Galderma) - 1.0 mL' },
                    { value: 'Stylage M / L (Vivacy) - 1.0 mL', label: 'Stylage M / L (Vivacy) - 1.0 mL' },
                    { value: 'Profhilo HA (IBSA) - 2.0 mL', label: 'Profhilo HA (IBSA) - 2.0 mL' },
                    { value: 'Radiesse CaHA (Merz) - 1.5 mL', label: 'Radiesse CaHA (Merz) - 1.5 mL' },
                    { value: 'Sculptra PLLA (Galderma)', label: 'Sculptra PLLA (Galderma)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="lotNumber" label={tx('رقم التشغيلة / اللوت (Lot #)', 'Batch / Lot #')} initialValue={lotNumber}>
                <Input placeholder="مثال: C38491-02" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expiryDate" label={tx('تاريخ انتهاء الصلاحية', 'Expiration Date')} initialValue={expiryDate}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dosage" label={tx('الجرعة / الكمية المحقونة', 'Injected Dosage / Volume')}>
                <InputNumber
                  min={0.1}
                  step={0.5}
                  placeholder="مثال: 20 أو 1.0"
                  style={{ width: '100%' }}
                  addonAfter={tx('وحدة / مل', 'U / mL')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="targetArea"
                label={tx('المناطق التشريحية المعالجة', 'Target Anatomic Zones')}
                initialValue={['الجلابيلا وخطوط بين الحاجبين', 'الجبهة والخطوط التعبيرية']}
              >
                <Select
                  mode="multiple"
                  placeholder={tx('اختاري المناطق المحقونة...', 'Select target facial zones...')}
                  options={[
                    { value: 'الجلابيلا وخطوط بين الحاجبين (Glabella)', label: 'الجلابيلا وخطوط بين الحاجبين (Glabella)' },
                    { value: 'الجبهة والخطوط التعبيرية (Forehead)', label: 'الجبهة والخطوط التعبيرية (Forehead)' },
                    { value: 'حول العينين - خطوط الابتسامة (Crow\'s Feet)', label: 'حول العينين - خطوط الابتسامة (Crow\'s Feet)' },
                    { value: 'الشفاه وكنتور الشفاه (Lips & Contour)', label: 'الشفاه وكنتور الشفاه (Lips & Contour)' },
                    { value: 'الوجنات وعظام الخد (Cheeks & Malar)', label: 'الوجنات وعظام الخد (Cheeks & Malar)' },
                    { value: 'خطوط الابتسامة الأنفية (Nasolabial Folds)', label: 'خطوط الابتسامة الأنفية (Nasolabial Folds)' },
                    { value: 'خطوط الحزن والمارينيت (Marionette Lines)', label: 'خطوط الحزن والمارينيت (Marionette Lines)' },
                    { value: 'تحديد خط الفك والتكساس (Jawline & Texas)', label: 'تحديد خط الفك والتكساس (Jawline & Texas)' },
                    { value: 'تنحيف عضلة الفك الماضغة (Masseter)', label: 'تنحيف عضلة الفك الماضغة (Masseter)' },
                    { value: 'الذقن وتعديل تراجع الذقن (Chin)', label: 'الذقن وتعديل تراجع الذقن (Chin)' },
                    { value: 'الرقبة وتجميل نفرتيتي (Nefertiti Lift)', label: 'الرقبة وتجميل نفرتيتي (Nefertiti Lift)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="technique" label={tx('تقنية الحقن والإبرة', 'Injection Technique & Instrument')} initialValue="32G 4mm Nano-needle">
                <Select
                  options={[
                    { value: '32G 4mm Nano-needle (إبرة نانو فائقة الدقة)', label: '32G 4mm Nano-needle (إبرة نانو)' },
                    { value: '30G 13mm Needle (إبرة توكسين دقيقة)', label: '30G 13mm Needle (إبرة ميزو وتوكسين)' },
                    { value: '25G 50mm Cannula (كانيولا أمان فيلر)', label: '25G 50mm Cannula (كانيولا أمان فيلر)' },
                    { value: '27G 38mm Cannula (كانيولا ناعمة)', label: '27G 38mm Cannula (كانيولا ناعمة)' },
                    { value: 'Micro-droplet Bolus (حقن حطاطي قطري)', label: 'Micro-droplet Bolus' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="practitioner" label={tx('الطبيبة / الطبيب المعالج', 'Treating Physician')} initialValue="د. هبة رمضان">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="touchUpReview" label={tx('موعد جلسة الرتوش والمراجعة', 'Touch-up Review')} initialValue="مجدولة بعد 14 يوماً (أسبوعين)">
                <Select
                  options={[
                    { value: 'مجدولة بعد 14 يوماً (أسبوعين)', label: tx('مجدولة بعد 14 يوماً (أسبوعين)', 'Scheduled Day 14 (Two weeks)') },
                    { value: 'مجدولة بعد 21 يوماً (3 أسابيع)', label: tx('مجدولة بعد 21 يوماً (3 أسابيع)', 'Scheduled Day 21 (Three weeks)') },
                    { value: 'مجدولة بعد شهر', label: tx('مجدولة بعد شهر', 'Scheduled 1 Month') },
                    { value: 'لا يلزم رتوش (جلسة مكتملة)', label: tx('لا يلزم رتوش (جلسة مكتملة)', 'No Touch-up Needed (Completed)') },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label={tx('الملاحظات السريرية وخطة المتابعة', 'Clinical Observations & Follow-up Plan')}>
            <Input.TextArea
              rows={3}
              placeholder={tx('سجل تقييم الأنسجة، عدم وجود كدمات أو شحوب، توزيع الجرعات، تعليمات ما بعد الجلسة...', 'Record tissue compliance, absence of hematoma, post-care compliance...')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
