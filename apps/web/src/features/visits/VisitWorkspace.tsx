import { useState } from 'react';
import { Form, Row, Col, Card, Typography, Button, Space, message, Segmented } from 'antd';
import { Upload, CreditCard, FileCheck } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { ClinicType } from '@clinic/shared-types';
import { VisitHeader } from './VisitHeader';
import { VisitNoteEditor } from './VisitNoteEditor';
import { VisitMeasurements } from './VisitMeasurements';
import { LastVisitSummary } from './LastVisitSummary';
import { PrescriptionCard } from '../prescriptions/PrescriptionCard';
import { getSpecialtyPanel } from './specialty/registry';
import { SPECIALTY_LOCK } from '../../specialties';
import dayjs from 'dayjs';
import { WhatsAppModal } from '../whatsapp/WhatsAppModal';
import { templateVisitSummary } from '../whatsapp/whatsapp-helpers';

const { Text } = Typography;

// Human-readable short labels for the switcher tabs
const SPECIALTY_SHORT_LABELS: Partial<Record<ClinicType, string>> = {
  [ClinicType.DENTAL]: '🦷 Dental',
  [ClinicType.PHYSIOTHERAPY]: '🏃 Physio',
  [ClinicType.REHABILITATION]: '♻️ Rehab',
  [ClinicType.ORTHOPEDIC]: '🦴 Ortho',
  [ClinicType.AESTHETIC]: '✨ Aesthetic',
  [ClinicType.DERMATOLOGY]: '🧴 Derma',
  [ClinicType.OPHTHALMOLOGY]: '👁️ Eye',
  [ClinicType.ENT]: '👂 ENT',
  [ClinicType.NUTRITION]: '🥗 Nutrition',
  [ClinicType.PSYCHOLOGY]: '🧠 Psychology',
  [ClinicType.GENERAL_MEDICAL]: '🏥 General',
  [ClinicType.PEDIATRICS]: '👶 Pediatrics',
  [ClinicType.GYNECOLOGY]: '🌸 Gynecology',
  [ClinicType.OTHER]: '🔬 Other',
  [ClinicType.CUSTOM]: '⚙️ Custom',
};

interface VisitWorkspaceProps {
  patientId: string;
  visitId?: string;
  onBack: () => void;
  onCompleted?: () => void;
}

export function VisitWorkspace({
  patientId,
  visitId,
  onBack,
  onCompleted,
}: VisitWorkspaceProps) {
  const { clinic, user } = useAuthStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Multi-specialty: resolve available specialties for this clinic
  // (a single-specialty program build is locked to exactly one specialty)
  const allSpecialties: ClinicType[] = SPECIALTY_LOCK
    ? [SPECIALTY_LOCK]
    : (() => {
        const primary = clinic?.clinicType;
        const extras = (clinic?.specialties ?? []) as ClinicType[];
        if (!primary) return extras.length > 0 ? extras : [ClinicType.GENERAL_MEDICAL];
        const unique = [primary, ...extras.filter((s) => s !== primary)];
        return unique;
      })();

  const [activeSpecialty, setActiveSpecialty] = useState<ClinicType>(allSpecialties[0]);

  // Dynamically resolve specialty panel from active specialty
  const SpecialtyComponent = getSpecialtyPanel(activeSpecialty);


  const [patient] = useState({
    id: patientId,
    patientNumber: 'PAT-00001',
    fullName: 'Ahmad Hassan Al-Sayed',
    gender: 'male',
    age: '34 yrs',
    bloodType: 'O+',
  });

  const [allergies] = useState([
    { allergen: 'Penicillin', severity: 'life_threatening' },
    { allergen: 'Latex', severity: 'mild' },
  ]);

  const [lastVisit] = useState({
    visitDate: '2026-09-12T10:00:00Z',
    doctorName: 'Dr. Mariam Khalil',
    chiefComplaint: 'Follow-up 2 weeks post Botox injection for glabella and forehead rhytids',
    diagnosis: 'Dynamic upper facial rhytids (Glogau II) - Satisfactory relaxation achieved',
    treatmentPlan: '1. Administered 2U touch-up to right lateral frontalis.\n2. Advised to avoid pressure on injection sites for 24 hours.\n3. Scheduled next full maintenance session in 4 months.',
    versionNumber: 1,
  });

  const handleContinuePlan = (plan: string) => {
    const current = form.getFieldValue('treatmentPlan') || '';
    const combined = current ? `${current}\n\n[Continued from previous visit]:\n${plan}` : `[Continued from previous visit]:\n${plan}`;
    form.setFieldsValue({ treatmentPlan: combined });
    message.success('Previous plan appended to treatment plan');
  };

  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppMsg, setWhatsAppMsg] = useState('');
  const [isFinalizedAndPrompting, setIsFinalizedAndPrompting] = useState(false);

  const generatePostVisitMessage = () => {
    const vals = form.getFieldsValue();
    const complaint = vals.chiefComplaint ? `الشكوى والتشخيص: ${vals.chiefComplaint}` : '';
    const notes = vals.clinicalNotes ? `ملاحظات الفحص والكشف:\n${vals.clinicalNotes}` : '';
    const plan = vals.treatmentPlan || '';
    const followUp = vals.followUpDate ? dayjs(vals.followUpDate).format('YYYY-MM-DD') : undefined;

    const combinedNotes = [complaint, notes].filter(Boolean).join('\n\n');

    return templateVisitSummary({
      clinicName: clinic?.name || 'المركز الطبي التخصصي',
      patientName: patient.fullName,
      sessionDate: dayjs().format('YYYY-MM-DD'),
      diagnosisOrNotes: combinedNotes || 'كشف ومتابعة إكلينيكية دورية',
      treatmentPlan: plan || undefined,
      nextFollowUp: followUp,
    });
  };

  const handleOpenWhatsAppModal = () => {
    const msgText = generatePostVisitMessage();
    setWhatsAppMsg(msgText);
    setIsWhatsAppOpen(true);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success('Visit consultation draft saved');
    }, 600);
  };

  const handleFinalize = async () => {
    try {
      await form.validateFields();
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        message.success('Visit finalized and signed successfully');
        setIsFinalizedAndPrompting(true);
        // Automatically pop up WhatsApp modal so doctor sends notes to patient immediately
        const msgText = generatePostVisitMessage();
        setWhatsAppMsg(msgText);
        setIsWhatsAppOpen(true);
      }, 600);
    } catch {
      message.error('Please complete required clinical fields before finalizing');
    }
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Top Header */}
      <VisitHeader
        patient={patient}
        visitNumber={visitId ? 2 : 1}
        status={visitId ? 'in_progress' : 'draft'}
        allergies={allergies}
        doctorName={user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Tariq Mansour'}
        onBack={onBack}
        onSaveDraft={handleSaveDraft}
        onFinalize={handleFinalize}
        onSendWhatsApp={handleOpenWhatsAppModal}
        saving={saving}
      />

      <Form form={form} layout="vertical">
        <Row gutter={20}>
          {/* Left Column: Specialty Workspace + Clinical Notes + Measurements */}
          <Col xs={24} lg={16}>
            {/* Multi-Specialty Switcher — shown only when clinic has 2+ specialties */}
            {allSpecialties.length > 1 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 100%)',
                  border: '1px solid #C7D2FE',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5', whiteSpace: 'nowrap' }}>
                  ACTIVE DEPT
                </span>
                <Segmented
                  value={activeSpecialty}
                  onChange={(val) => setActiveSpecialty(val as ClinicType)}
                  options={allSpecialties.map((s) => ({
                    value: s,
                    label: SPECIALTY_SHORT_LABELS[s] ?? s,
                  }))}
                  style={{ flex: 1 }}
                />
              </div>
            )}

            {/* Dynamic Specialty Panel */}
            <SpecialtyComponent
              visitId={visitId}
              patientId={patientId}
            />


            {/* Structured Clinical Notes Editor */}
            <VisitNoteEditor form={form} />

            {/* Measurements & Vitals */}
            <VisitMeasurements visitId={visitId} />
          </Col>

          {/* Right Column: Previous Visit Summary + Prescriptions + Quick Actions */}
          <Col xs={24} lg={8}>
            {/* Previous Visit Summary with 1-click continuation */}
            <LastVisitSummary
              lastVisit={lastVisit}
              onContinuePlan={handleContinuePlan}
            />

            {/* Visit Prescriptions — smart Rx composer (catalog + allergies + DDI) */}
            <PrescriptionCard patientId={patientId} visitId={visitId} />

            {/* Quick Visit Files Card */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={15} color="#2563EB" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Attach Diagnostic Images / Files</span>
                </div>
              }
              style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
            >
              <div
                style={{
                  padding: '16px',
                  borderRadius: 8,
                  border: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                }}
                onClick={() => message.info('Attach files dialog')}
              >
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  Click to attach radiology, photo, or lab reports to this visit
                </Text>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={15} color="#2563EB" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Linked Administrative Actions</span>
                </div>
              }
              style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<FileCheck size={14} />}
                  onClick={() => message.info('Informed Consent signature modal')}
                  style={{ borderRadius: 8, textAlign: 'start' }}
                >
                  Record Procedure Consent
                </Button>
                <Button
                  block
                  type="dashed"
                  icon={<CreditCard size={14} />}
                  onClick={() => message.info('Generate Visit Invoice')}
                  style={{ borderRadius: 8, textAlign: 'start' }}
                >
                  Generate Invoice for Visit
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Post-Visit Clinical Summary WhatsApp Modal */}
      <WhatsAppModal
        open={isWhatsAppOpen}
        onClose={() => {
          setIsWhatsAppOpen(false);
          if (isFinalizedAndPrompting) {
            if (onCompleted) onCompleted();
            else onBack();
          }
        }}
        patientName={patient.fullName}
        defaultMessage={whatsAppMsg}
        title="إرسال ملخص الكشف وملاحظات الطبيب عبر WhatsApp"
        subtitle="مراجعة الرسالة وإرسال التقرير الطبي والتعليمات إلى هاتف المريض مباشرة"
      />
    </div>
  );
}
