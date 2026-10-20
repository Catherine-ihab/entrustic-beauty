import { useState } from 'react';
import { Table, Button, Tag, Space, Form, Input, Select, DatePicker, Modal, message, Tooltip, Badge } from 'antd';
import { Plus, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAllergies, createAllergy, updateAllergy, type PatientAllergy } from '../api';
import { EmptyState } from '../../../../design-system';
import dayjs from 'dayjs';
import { useLang } from '../../../../lib/useLang';

const SEVERITY_TAG: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  life_threatening: { color: '#DC2626', bg: '#FEF2F2', labelAr: '⚠️ مهددة للحياة', labelEn: '⚠️ Life-Threatening' },
  severe:           { color: '#C2410C', bg: '#FFF7ED', labelAr: 'شديدة', labelEn: 'Severe' },
  moderate:         { color: '#B45309', bg: '#FFFBEB', labelAr: 'متوسطة', labelEn: 'Moderate' },
  mild:             { color: '#16A34A', bg: '#F0FDF4', labelAr: 'خفيفة', labelEn: 'Mild' },
  unknown:          { color: '#64748B', bg: '#F8FAFC', labelAr: 'غير محددة', labelEn: 'Unknown' },
};

interface AllergiesTabProps {
  patientId: string;
  readonly?: boolean;
}

export function AllergiesTab({ patientId, readonly = false }: AllergiesTabProps) {
  const { tx } = useLang();
  const { data: allergies, loading, refetch } = useAllergies(patientId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const SEVERITY_OPTIONS = [
    { value: 'mild', label: tx('خفيفة', 'Mild') },
    { value: 'moderate', label: tx('متوسطة', 'Moderate') },
    { value: 'severe', label: tx('شديدة', 'Severe') },
    { value: 'life_threatening', label: tx('⚠️ مهددة للحياة', '⚠️ Life-Threatening') },
    { value: 'unknown', label: tx('غير محددة', 'Unknown') },
  ];

  const TYPE_OPTIONS = [
    { value: 'medication', label: tx('أدوية ومستحضرات', 'Medication') },
    { value: 'food', label: tx('أغذية وأطعمة', 'Food') },
    { value: 'environmental', label: tx('بيئية وموسمية', 'Environmental') },
    { value: 'latex', label: tx('لاتكس ومطاط', 'Latex') },
    { value: 'contrast', label: tx('صبغات تباين', 'Contrast Agent') },
    { value: 'other', label: tx('أخرى', 'Other') },
    { value: 'unknown', label: tx('غير محدد', 'Unknown') },
  ];

  const STATUS_OPTIONS = [
    { value: 'active', label: tx('نشطة', 'Active') },
    { value: 'resolved', label: tx('تم الشفاء منها', 'Resolved') },
    { value: 'unconfirmed', label: tx('غير مؤكدة', 'Unconfirmed') },
  ];

  const openNew = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', severity: 'unknown', allergy_type: 'unknown' });
    setModalOpen(true);
  };

  const openEdit = (record: PatientAllergy) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      onset_date: record.onset_date ? dayjs(record.onset_date) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const dto = {
        ...values,
        onset_date: values.onset_date ? values.onset_date.format('YYYY-MM-DD') : null,
      };
      if (editingId) {
        await updateAllergy(patientId, editingId, dto);
        message.success(tx('تم تحديث بيانات الحساسية', 'Allergy updated'));
      } else {
        await createAllergy(patientId, dto);
        message.success(tx('تم تسجيل الحساسية بالملف الطبي', 'Allergy recorded'));
      }
      setModalOpen(false);
      refetch();
    } catch {
      message.error(tx('فشل حفظ بيانات الحساسية', 'Failed to save allergy'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: tx('مادة أو مسبب الحساسية', 'Allergen'),
      dataIndex: 'allergen',
      key: 'allergen',
      render: (val: string, r: PatientAllergy) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {r.severity === 'life_threatening' && (
            <Tooltip title={tx('حساسية مهددة للحياة — توخي الحذر الشديد', 'Life-threatening allergy — extreme caution required')}>
              <ShieldAlert size={15} color="#DC2626" />
            </Tooltip>
          )}
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
        </div>
      ),
    },
    {
      title: tx('النوع', 'Type'),
      dataIndex: 'allergy_type',
      key: 'allergy_type',
      render: (val: string) => (
        <Tag style={{ textTransform: 'capitalize', borderRadius: 6 }}>{val.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: tx('الأعراض ورد الفعل', 'Reaction'),
      dataIndex: 'reaction',
      key: 'reaction',
      render: (val: string | null) => val || <span style={{ color: '#94A3B8' }}>—</span>,
    },
    {
      title: tx('درجة الخطورة', 'Severity'),
      dataIndex: 'severity',
      key: 'severity',
      render: (val: string) => {
        const s = SEVERITY_TAG[val] || SEVERITY_TAG['unknown'];
        return (
          <Badge
            style={{
              backgroundColor: s.bg,
              color: s.color,
              border: `1px solid ${s.color}40`,
              fontWeight: 600,
              fontSize: 12,
              borderRadius: 6,
              padding: '2px 10px',
            }}
            count={tx(s.labelAr, s.labelEn)}
          />
        );
      },
    },
    {
      title: tx('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => (
        <Tag color={val === 'active' ? 'red' : val === 'resolved' ? 'green' : 'orange'}>
          {val === 'active' ? tx('نشطة', 'Active') : val === 'resolved' ? tx('منتهية', 'Resolved') : tx('غير مؤكدة', 'Unconfirmed')}
        </Tag>
      ),
    },
    {
      title: tx('تاريخ البدء', 'Onset'),
      dataIndex: 'onset_date',
      key: 'onset_date',
      render: (val: string | null) => val || <span style={{ color: '#94A3B8' }}>—</span>,
    },
    ...(!readonly
      ? [{
          title: tx('إجراء', ''),
          key: 'actions',
          width: 80,
          render: (_: any, r: PatientAllergy) => (
            <Button size="small" type="text" onClick={() => openEdit(r)}>{tx('تعديل', 'Edit')}</Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={18} color="#64748B" />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>{tx('سجل الحساسية والتحذيرات الطبية', 'Allergies')}</span>
          {allergies.length === 0 && (
            <Tag color="warning" icon={<AlertTriangle size={11} />} style={{ marginInlineStart: 8 }}>
              {tx('لم يتم تأكيد الحساسية بعد — يرجى التأكيد مع الحالة', 'Allergy status unconfirmed — please verify with patient')}
            </Tag>
          )}
        </div>
        {!readonly && (
          <Button type="primary" icon={<Plus size={15} />} onClick={openNew} size="small" style={{ borderRadius: 6, backgroundColor: '#be185d', borderColor: '#be185d' }}>
            {tx('+ إضافة حساسية', 'Add Allergy')}
          </Button>
        )}
      </div>

      {allergies.length === 0 && !loading ? (
        <EmptyState
          icon="shield"
          title={tx('لا توجد سجلات حساسية مسجلة', 'No allergies recorded')}
          description={tx('تأكد دائماً من وجود أي حساسية لدى العميلة قبل بدء أي إجراء ليزر أو حقن أو تقشير.', 'Always confirm allergy status with the patient before any procedure or prescription.')}
          action={!readonly ? { label: tx('+ تسجيل حساسية', 'Record Allergy'), onClick: openNew } : undefined}
        />
      ) : (
        <Table
          dataSource={allergies}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={false}
          rowClassName={(r) =>
            r.severity === 'life_threatening' ? 'allergy-row-critical' : ''
          }
          style={{ borderRadius: 10, overflow: 'hidden' }}
        />
      )}

      <Modal
        title={editingId ? tx('تعديل بيانات الحساسية', 'Edit Allergy') : tx('تسجيل حساسية جديدة للحالة', 'Record Allergy')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={tx('حفظ', 'Save')}
        cancelText={tx('إلغاء', 'Cancel')}
        confirmLoading={saving}
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="allergen" label={tx('المادة المسببة للحساسية', 'Allergen / Substance')} rules={[{ required: true, message: tx('هذا الحقل مطلوب', 'Required') }]}>
            <Input placeholder={tx('مثال: البنسلين، اللاتكس، الليدوكائين، حمض التريكلوروسيتيك', 'e.g. Penicillin, Peanuts, Latex')} />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="allergy_type" label={tx('التصنيف', 'Type')} style={{ flex: 1 }}>
              <Select options={TYPE_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="severity" label={tx('درجة الخطورة', 'Severity')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={SEVERITY_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="reaction" label={tx('الأعراض المصاحبة', 'Reaction / Symptoms')}>
            <Input placeholder={tx('مثال: تورم، احمرار شديد، صدمة تحسسية، ضيق تنفس', 'e.g. Anaphylaxis, Rash, Swelling')} />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="status" label={tx('الحالة', 'Status')} style={{ flex: 1 }}>
              <Select options={STATUS_OPTIONS} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="onset_date" label={tx('تاريخ الظهور الأول', 'Onset Date')} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label={tx('ملاحظات إضافية', 'Notes')}>
            <Input.TextArea rows={3} placeholder={tx('أي تفاصيل علاجية أو إجراءات وقائية لازمة...', 'Additional notes...')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
