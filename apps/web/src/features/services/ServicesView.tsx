import { useState, useMemo, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Typography, message, Space, Popconfirm, Tooltip, Switch } from 'antd';
import { useLang } from '../../lib/useLang';
import { IClinicService, ClinicType } from '@clinic/shared-types';
import { Plus, Search, Edit2, Trash2, RotateCcw, Clock, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { SPECIALTY_LOCK } from '../../specialties';

const { Title } = Typography;

// Specialty services catalog (8 core clinical procedures per specialty)
const SPECIALTY_SERVICES_CATALOG: Record<
  string,
  Array<{ name: string; description: string; duration: number; price: number }>
> = {
  [ClinicType.GENERAL_MEDICAL]: [
    { name: 'Initial Consultation', description: 'Comprehensive primary care examination and assessment', duration: 30, price: 200 },
    { name: 'Follow-Up Visit', description: 'Evaluation of treatment response and routine check', duration: 20, price: 150 },
    { name: 'Chronic Disease Review', description: 'Hypertension, diabetes, and metabolic management checkup', duration: 45, price: 300 },
    { name: 'Minor In-Office Procedure', description: 'Wound care, dressing, suture removal or drainage', duration: 30, price: 350 },
    { name: 'Lab Results Interpretation', description: 'Detailed review of diagnostics and medication adjustment', duration: 20, price: 250 },
    { name: 'Preventive Health Screening', description: 'Annual health checkup, cardiovascular risk review', duration: 40, price: 300 },
    { name: 'Routine Adult Vaccination', description: 'Administration and immunization record counseling', duration: 15, price: 200 },
    { name: 'Home Visit Consultation', description: 'On-site medical consultation for homebound patients', duration: 60, price: 500 },
  ],
  [ClinicType.DENTAL]: [
    { name: 'Dental Examination & X-Ray', description: 'Intraoral inspection and digital diagnostic imaging', duration: 30, price: 250 },
    { name: 'Scaling & Polishing', description: 'Ultrasonic plaque removal, prophylaxis and stain polishing', duration: 45, price: 350 },
    { name: 'Composite Dental Filling', description: 'Tooth-colored posterior or anterior composite restoration', duration: 45, price: 400 },
    { name: 'Root Canal Treatment (Endodontics)', description: 'Biomechanical instrumentation and canal obturation', duration: 90, price: 800 },
    { name: 'Surgical Tooth Extraction', description: 'Atraumatic dental extraction with local anesthesia', duration: 30, price: 300 },
    { name: 'In-Clinic Teeth Whitening', description: 'Laser / LED activated whitening session', duration: 60, price: 600 },
    { name: 'Crown & Bridge Preparation', description: 'Prosthodontic tooth reduction, impression and temporization', duration: 60, price: 750 },
    { name: 'Orthodontic Consultation', description: 'Malocclusion assessment and clear aligner / bracket planning', duration: 30, price: 300 },
  ],
  [ClinicType.DERMATOLOGY]: [
    { name: 'Dermatology Consultation', description: 'Skin, hair, and nail clinical evaluation', duration: 30, price: 300 },
    { name: 'Acne & Rosacea Protocol Session', description: 'Medical comedone extraction and topical medical regimen', duration: 45, price: 400 },
    { name: 'Full-Body Digital Mole Mapping', description: 'High-magnification dermatoscope pigmented lesion surveillance', duration: 45, price: 500 },
    { name: 'Medical Chemical Peel', description: 'Salicylic / glycolic / TCA peel for dermatological indications', duration: 45, price: 500 },
    { name: 'Diamond Microdermabrasion', description: 'Mechanical stratum corneum exfoliation', duration: 45, price: 450 },
    { name: 'Skin Infection / Lesion Treatment', description: 'Evaluation and localized treatment of bacterial/viral infections', duration: 20, price: 250 },
    { name: 'Skin Punch Biopsy & Lab Review', description: 'Diagnostic skin biopsy under local anesthesia', duration: 30, price: 350 },
    { name: 'Dermatology Follow-Up Review', description: 'Progress review and maintenance regimen tuning', duration: 20, price: 150 },
  ],
  [ClinicType.AESTHETIC]: [
    { name: 'Aesthetic Medical Consultation', description: 'Facial harmony assessment and aesthetic treatment plan', duration: 30, price: 300 },
    { name: 'Chemical Glow Peel Session', description: 'Superficial skin rejuvenation and pigment correction', duration: 45, price: 600 },
    { name: 'Laser Hair Removal Session', description: 'Dual Alexandrite / Nd:YAG laser photo-epilation', duration: 30, price: 700 },
    { name: 'Botox Anti-Wrinkle Injection', description: 'Botulinum toxin type A treatment for dynamic lines', duration: 30, price: 1500 },
    { name: 'Hyaluronic Acid Dermal Filler', description: 'Volume restoration, lip enhancement or contouring', duration: 45, price: 2500 },
    { name: 'Microneedling with PRP', description: 'Collagen induction therapy combined with autologous platelet-rich plasma', duration: 60, price: 1200 },
    { name: 'Skin Booster Biorevitalization', description: 'Non-crosslinked hyaluronic acid micro-injections', duration: 30, price: 1000 },
    { name: 'Post-Procedure Aesthetic Review', description: 'Assessment of symmetry, touch-ups and recovery review', duration: 20, price: 250 },
  ],
  [ClinicType.PHYSIOTHERAPY]: [
    { name: 'Physiotherapy Comprehensive Assessment', description: 'Musculoskeletal, posture, and biomechanical evaluation', duration: 45, price: 350 },
    { name: 'Therapeutic Exercise Session', description: 'Targeted strengthening, stability, and mobility program', duration: 60, price: 400 },
    { name: 'Manual Therapy & Joint Mobilization', description: 'Hands-on manipulation, myofascial release, joint mobilization', duration: 45, price: 450 },
    { name: 'Ultrasound & Electrotherapy Session', description: 'TENS, NMES, and therapeutic deep ultrasound therapy', duration: 30, price: 250 },
    { name: 'Trigger Point Dry Needling', description: 'Intramuscular stimulation for myofascial trigger points', duration: 45, price: 500 },
    { name: 'Post-Injury Rehabilitation Plan', description: 'Progressive load management and sports reconditioning', duration: 60, price: 500 },
    { name: 'Home Exercise Program Setup', description: 'Instruction and guided patient home exercise regimen', duration: 30, price: 300 },
    { name: 'Physiotherapy Progress Review', description: 'Range of motion and functional recovery reassessment', duration: 30, price: 250 },
  ],
  [ClinicType.REHABILITATION]: [
    { name: 'Rehabilitation Assessment', description: 'Functional independence measure and motor deficit staging', duration: 45, price: 350 },
    { name: 'Neurological Rehabilitation Session', description: 'Stroke, Parkinson, or brain injury neuro-motor facilitation', duration: 60, price: 500 },
    { name: 'Gait & Locomotor Training', description: 'Body-weight supported gait retraining on treadmill/bars', duration: 60, price: 450 },
    { name: 'Post-Stroke Functional Recovery', description: 'Task-oriented upper and lower extremity motor relearning', duration: 60, price: 550 },
    { name: 'Cardiopulmonary Rehabilitation', description: 'Breathing exercises, chest clearance, and aerobic conditioning', duration: 45, price: 400 },
    { name: 'Pediatric Rehabilitation Session', description: 'Cerebral palsy and developmental delay therapy', duration: 45, price: 450 },
    { name: 'Orthosis & Assistive Device Fitting', description: 'Splinting, wheelchair adaptation, and orthotic alignment', duration: 30, price: 350 },
    { name: 'Caregiver Handling Training', description: 'Safe patient transfer and at-home mobility education', duration: 30, price: 250 },
  ],
  [ClinicType.ORTHOPEDIC]: [
    { name: 'Orthopedic Consultation', description: 'Clinical bone, joint, and ligament diagnostic examination', duration: 30, price: 350 },
    { name: 'Fracture Casting & Immobilization', description: 'Fiberglass / plaster cast application and limb stabilization', duration: 45, price: 500 },
    { name: 'Intra-Articular Joint Injection', description: 'Hyaluronic acid or corticosteroid knee/shoulder injection', duration: 30, price: 600 },
    { name: 'Sports Injury Evaluation', description: 'Ligament sprains (ACL, meniscus), tendonitis assessment', duration: 45, price: 400 },
    { name: 'Spine & Disc Disorder Session', description: 'Cervical/lumbar radiculopathy conservative therapy workup', duration: 60, price: 500 },
    { name: 'Post-Operative Orthopedic Follow-Up', description: 'Surgical wound check, implant surveillance, and healing staging', duration: 30, price: 300 },
    { name: 'Computerized Gait & Foot Analysis', description: 'Baropodometric plantar pressure and foot alignment scan', duration: 45, price: 350 },
    { name: 'Diagnostic Imaging Review', description: 'In-depth review of MRI, CT scans, and radiograph reports', duration: 20, price: 250 },
  ],
  [ClinicType.NUTRITION]: [
    { name: 'Comprehensive Nutrition Assessment', description: 'Dietary recall, lifestyle habits, and anthropometric evaluation', duration: 45, price: 350 },
    { name: 'Personalized Medical Diet Plan', description: 'Macronutrient-calculated meal plan customized to lab profile', duration: 45, price: 500 },
    { name: 'Body Composition Analysis (BIA)', description: 'Segmental muscle-fat analysis, visceral fat, phase angle scan', duration: 30, price: 300 },
    { name: 'Weight Management Follow-Up', description: 'Progress review, compliance tracking, and caloric adjustment', duration: 20, price: 250 },
    { name: 'Sports Nutrition Consultation', description: 'Pre-competition fueling, hydration, and ergogenic supplementation', duration: 45, price: 400 },
    { name: 'Pediatric Growth Nutrition', description: 'Failure to thrive, picky eating, and childhood growth optimization', duration: 45, price: 400 },
    { name: 'Diabetes & Renal Nutrition Session', description: 'Carbohydrate counting, glycemic index and kidney protection diet', duration: 45, price: 450 },
    { name: 'Monthly Maintenance Check-In', description: 'Metabolic habit sustainability and nutritional guidance', duration: 20, price: 200 },
  ],
  [ClinicType.PSYCHOLOGY]: [
    { name: 'Initial Psychological Assessment', description: 'Clinical history, mental state examination, and diagnostic intake', duration: 60, price: 600 },
    { name: 'Individual Psychotherapy Session', description: 'Evidence-based talk therapy for mood and anxiety disorders', duration: 60, price: 700 },
    { name: 'Cognitive Behavioral Therapy (CBT)', description: 'Structured cognitive restructuring and behavioral experiments', duration: 60, price: 750 },
    { name: 'Psychometric Battery Testing', description: 'Standardized psychological scales (PHQ-9, GAD-7, Beck, personality)', duration: 45, price: 400 },
    { name: 'Couples & Family Therapy Session', description: 'Relational dynamics, communication restructuring, and conflict resolution', duration: 90, price: 1000 },
    { name: 'Child & Adolescent Behavioral Therapy', description: 'Developmental behavioral therapy and emotional regulation', duration: 60, price: 650 },
    { name: 'Psychological Crisis Intervention', description: 'Acute trauma, grief, and de-escalation therapeutic support', duration: 45, price: 800 },
    { name: 'Psychotherapy Progress Follow-Up', description: 'Goal evaluation and maintenance strategy review', duration: 30, price: 400 },
  ],
  [ClinicType.OPHTHALMOLOGY]: [
    { name: 'Comprehensive Eye Examination', description: 'Visual acuity, biomicroscopy, intraocular pressure measurement', duration: 30, price: 300 },
    { name: 'Automated Visual Field Test', description: 'Humphrey visual field perimetry for glaucoma monitoring', duration: 30, price: 350 },
    { name: 'Retinal Imaging (Fundus & OCT)', description: 'Macular and optic nerve head optical coherence tomography', duration: 30, price: 400 },
    { name: 'Refraction & Optical Prescription', description: 'Autorefraction, subjective cross-cylinder refraction for spectacles', duration: 20, price: 200 },
    { name: 'Dry Eye Diagnostic & Treatment', description: 'Tear break-up time (TBUT), meibomian gland expression', duration: 30, price: 350 },
    { name: 'Cataract Pre-Operative Workup', description: 'Biometry, intraocular lens power calculation, surgical counseling', duration: 45, price: 500 },
    { name: 'Glaucoma Surveillance & Follow-Up', description: 'Pachymetry, gonioscopy, and optic disc cupping monitoring', duration: 20, price: 300 },
    { name: 'Minor In-Office Eye Procedure', description: 'Foreign body removal, chalazion incision and curettage, epilation', duration: 45, price: 600 },
  ],
  [ClinicType.ENT]: [
    { name: 'Complete ENT Examination', description: 'Otoscopy, anterior rhinoscopy, oropharyngeal inspection', duration: 30, price: 300 },
    { name: 'Pure-Tone & Speech Audiometry', description: 'Air and bone conduction threshold hearing diagnostic test', duration: 45, price: 400 },
    { name: 'Diagnostic Nasal Endoscopy', description: 'Rigid/flexible fiberoptic visualization of nasal cavities and sinuses', duration: 30, price: 450 },
    { name: 'Allergy & Sinus Clinic Session', description: 'Sinusitis evaluation, nasal irrigation counseling, allergy review', duration: 30, price: 350 },
    { name: 'Laryngoscopy & Voice Clinic', description: 'Vocal cord visualization and dysphonia assessment', duration: 30, price: 300 },
    { name: 'Tonsil & Adenoid Pre-Op Assessment', description: 'Pediatric sleep apnea review and tonsillectomy workup', duration: 45, price: 500 },
    { name: 'Vestibular & Vertigo Assessment', description: 'Dix-Hallpike positional testing, Epley canalith repositioning', duration: 45, price: 450 },
    { name: 'Hearing Aid Prescription & Fitting', description: 'Digital hearing amplification counseling and acoustic fitting', duration: 60, price: 700 },
  ],
  [ClinicType.PEDIATRICS]: [
    { name: 'Newborn Health Checkup', description: 'Neonatal reflex check, jaundice screening, umbilical care review', duration: 30, price: 250 },
    { name: 'Well-Child Milestone Visit', description: 'Growth tracking, neurodevelopmental milestones assessment', duration: 30, price: 300 },
    { name: 'Pediatric Immunization Session', description: 'National schedule and elective vaccination administration', duration: 15, price: 250 },
    { name: 'Growth & Development Review', description: 'WHO percentile height/weight curves and nutritional assessment', duration: 30, price: 350 },
    { name: 'Acute Pediatric Illness Visit', description: 'Pediatric fever, respiratory infection, gastrointestinal evaluation', duration: 20, price: 250 },
    { name: 'Pediatric Asthma & Allergy Review', description: 'Inhaler technique instruction and spacer assessment', duration: 30, price: 400 },
    { name: 'Pediatric Behavioral Screening', description: 'Screening for ADHD, sensory processing, and school difficulties', duration: 30, price: 350 },
    { name: 'Pediatric Follow-Up Visit', description: 'Post-infection recovery check and medication adjustment', duration: 20, price: 200 },
  ],
  [ClinicType.GYNECOLOGY]: [
    { name: 'Gynecological Examination', description: 'Pelvic examination, bimanual palpation, and symptom review', duration: 30, price: 350 },
    { name: 'Antenatal Routine Visit', description: 'Maternal blood pressure, fundal height, and fetal heart rate check', duration: 30, price: 400 },
    { name: 'Obstetric 3D/4D Ultrasound Scan', description: 'Fetal anatomy survey, growth assessment, and Doppler flow study', duration: 30, price: 500 },
    { name: 'Cervical Pap Smear & HPV Screening', description: 'Liquid-based cytology sampling and oncogenic screening', duration: 30, price: 400 },
    { name: 'Family Planning & Contraception', description: 'Contraceptive counseling, IUD insertion / removal', duration: 30, price: 300 },
    { name: 'Menstrual Disorder Evaluation', description: 'PCOS, abnormal uterine bleeding, dysmenorrhea workup', duration: 30, price: 350 },
    { name: 'Infertility Diagnostic Workup', description: 'Ovulation tracking, hormonal profile, and tubal patency guidance', duration: 45, price: 600 },
    { name: 'Postnatal Maternal Checkup', description: '6-week postpartum maternal recovery, pelvic floor, mental health', duration: 30, price: 350 },
  ],
};

export function ServicesView({ currency = 'EGP' }: { currency?: string }) {
  const { tx } = useLang();
  const { clinic } = useAuthStore();
  const currentSpecialty =
    (clinic?.clinicType as ClinicType) || SPECIALTY_LOCK || ClinicType.GENERAL_MEDICAL;

  const storageKey = `clinic_services_${currentSpecialty}_${clinic?.id || 'default'}`;

  // Build default list from specialty catalog
  const defaultServices = useMemo<IClinicService[]>(() => {
    const catalog = SPECIALTY_SERVICES_CATALOG[currentSpecialty] || SPECIALTY_SERVICES_CATALOG[ClinicType.GENERAL_MEDICAL];
    return catalog.map((item, idx) => ({
      id: `srv-${currentSpecialty}-${idx + 1}`,
      clinicId: clinic?.id || 'current-clinic',
      name: item.name,
      description: item.description,
      defaultDurationMinutes: item.duration,
      currentPrice: item.price,
      currency,
      isActive: true,
      sortOrder: idx + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [currentSpecialty, clinic?.id, currency]);

  // Load from localStorage or defaults
  const [services, setServices] = useState<IClinicService[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return defaultServices;
  });

  // Reload when specialty changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setServices(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setServices(defaultServices);
  }, [storageKey, defaultServices]);

  const persistServices = (updated: IClinicService[]) => {
    setServices(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<IClinicService | null>(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  // Open modal to add service
  const handleOpenAdd = () => {
    setEditingService(null);
    form.resetFields();
    form.setFieldsValue({
      defaultDurationMinutes: 30,
      currentPrice: 200,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal to edit service
  const handleOpenEdit = (record: IClinicService) => {
    setEditingService(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      defaultDurationMinutes: record.defaultDurationMinutes,
      currentPrice: record.currentPrice,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  // Submit create or edit
  const handleSubmit = (values: any) => {
    const formatted: IClinicService = {
      id: editingService ? editingService.id : `srv-${Date.now()}`,
      clinicId: clinic?.id || 'current-clinic',
      name: values.name,
      description: values.description,
      defaultDurationMinutes: Number(values.defaultDurationMinutes) || 30,
      currentPrice: Number(values.currentPrice) || 0,
      currency,
      isActive: values.isActive ?? true,
      sortOrder: editingService ? editingService.sortOrder : services.length + 1,
      createdAt: editingService ? editingService.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingService) {
      const updated = services.map((s) => (s.id === editingService.id ? formatted : s));
      persistServices(updated);
      message.success('Clinical service updated successfully');
    } else {
      persistServices([...services, formatted]);
      message.success('New clinical service added');
    }

    setIsModalOpen(false);
    setEditingService(null);
    form.resetFields();
  };

  // Delete service
  const handleDelete = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    persistServices(updated);
    message.success('Service removed from catalog');
  };

  // Toggle active status
  const handleToggleActive = (id: string, active: boolean) => {
    const updated = services.map((s) => (s.id === id ? { ...s, isActive: active } : s));
    persistServices(updated);
    message.info(active ? 'Service activated' : 'Service marked inactive');
  };

  // Reset defaults
  const handleResetDefaults = () => {
    persistServices(defaultServices);
    message.info(tx('تم إعادة ضبط الخدمات', 'Reset services to specialty default catalog'));
  };

  const columns = [
    {
      title: tx('اسم الخدمة ونطاقها', 'Service Name & Clinical Scope'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r: IClinicService) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{name}</div>
          {r.description && (
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{r.description}</div>
          )}
        </div>
      ),
    },
    {
      title: tx('المدة', 'Duration'),
      dataIndex: 'defaultDurationMinutes',
      key: 'duration',
      render: (m: number) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155', fontWeight: 500, fontSize: 12 }}>
          <Clock size={13} color="#64748B" />
          {tx(`${m} دقيقة`, `${m} mins`)}
        </span>
      ),
    },
    {
      title: tx('السعر / الرسوم', 'Fee / Price'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => (
        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <DollarSign size={13} color="#059669" />
          {Number(price).toFixed(2)} {currency}
        </span>
      ),
    },
    {
      title: tx('الحالة في الكتالوج', 'Catalog Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean, r: IClinicService) => (
        <Switch
          checked={active}
          checkedChildren={tx('نشط', 'Active')}
          unCheckedChildren={tx('غير نشط', 'Inactive')}
          onChange={(checked) => handleToggleActive(r.id, checked)}
        />
      ),
    },
    {
      title: tx('إجراءات', 'Actions'),
      key: 'actions',
      render: (_: any, r: IClinicService) => (
        <Space size="small">
          <Tooltip title={tx('تعديل الخدمة', 'Edit Service')}>
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={15} color="#2563EB" />}
              onClick={() => handleOpenEdit(r)}
            />
          </Tooltip>
          <Tooltip title={tx('حذف الخدمة', 'Delete Service')}>
            <Popconfirm
              title={tx('حذف الخدمة', 'Delete Clinical Service')}
              description={`Are you sure you want to delete "${r.name}"?`}
              okText={tx('حذف', 'Delete')}
              cancelText={tx('إلغاء', 'Cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(r.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={15} />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
            {tx('دليل خدمات وأسعار العيادة', 'Clinic Services Catalog')}
          </Title>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {tx('قائمة الخدمات والإجراءات الطبية والتجميلية، رسوم الجلسات، والمدد الزمنية المتوقعة لكل إجراء.', 'Tailored medical services, consultation fees, and session durations for this specialty. Edit or delete any service as needed.')}
          </div>
        </div>

        <Space>
          <Input
            placeholder={tx('بحث في الخدمات والأسعار...', 'Search clinical services...')}
            prefix={<Search size={14} color="#94A3B8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 220, borderRadius: 8 }}
          />
          <Tooltip title={tx('استعادة قائمة الخدمات الافتراضية', 'Reset to standard specialty services')}>
            <Button icon={<RotateCcw size={14} />} onClick={handleResetDefaults}>
              {tx('إعادة الافتراضي', 'Reset Defaults')}
            </Button>
          </Tooltip>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleOpenAdd} style={{ height: 38, fontWeight: 600, backgroundColor: '#be185d', borderColor: '#be185d', borderRadius: 8 }}>
            {tx('+ إضافة خدمة جديدة', 'Add Service')}
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredServices}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
      />

      <Modal
        title={editingService ? tx(`تعديل الخدمة — ${editingService.name}`, `Edit Service — ${editingService.name}`) : tx('إضافة خدمة طبية / تجميلية جديدة', 'Add Clinical Service')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        onOk={() => form.submit()}
        okText={editingService ? tx('حفظ التعديلات', 'Save Changes') : tx('إنشاء الخدمة', 'Create Service')}
        cancelText={tx('إلغاء', 'Cancel')}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 14 }}>
          <Form.Item name="name" label={tx('اسم الخدمة', 'Service Name')} rules={[{ required: true, message: tx('برجاء إدخال اسم الخدمة', 'Please enter service name') }]}>
            <Input placeholder={tx('مثال: جلسة ليزر كانديلا أو تنظيف هيدرافيشل', 'e.g. Comprehensive Consultation')} />
          </Form.Item>
          <Form.Item name="description" label={tx('الوصف الإكلينيكي ونطاق الإجراء', 'Clinical Description / Scope')}>
            <Input.TextArea rows={2} placeholder={tx('ما يشمله الإجراء، المكونات، نوع الجهاز المستخدم...', 'Explain what is included in this consultation or procedure')} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="defaultDurationMinutes" label={tx('المدة المقدرة (بالدقائق)', 'Duration (minutes)')} rules={[{ required: true, message: tx('المدة مطلوبة', 'Required') }]}>
              <InputNumber min={5} max={360} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="currentPrice"
              label={`${tx('السعر / الرسوم', 'Fee / Price')} (${currency})`}
              rules={[{ required: true, message: tx('السعر مطلوب', 'Price is required') }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="isActive" label={tx('متاحة للحجز والفواتير', 'Available in Booking & Invoicing')} valuePropName="checked" initialValue={true}>
            <Switch checkedChildren={tx('نشطة', 'Active')} unCheckedChildren={tx('معطلة', 'Inactive')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
