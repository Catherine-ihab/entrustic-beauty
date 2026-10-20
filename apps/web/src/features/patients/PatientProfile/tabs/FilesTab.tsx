import { useState } from 'react';
import { Table, Button, Form, Input, Select, Modal, message, Tag, Upload, Tooltip, Image as AntImage, Popconfirm } from 'antd';
import { Plus, FolderOpen, Download, Archive, FileText, Image, FlaskConical, Film, FileCheck, Send, Eye } from 'lucide-react';
import { type PatientFile } from '../api';
import { EmptyState } from '../../../../design-system';

const CATEGORY_OPTIONS = [
  { value: 'radiology', label: 'أشعة (Radiology / X-Ray)' },
  { value: 'lab', label: 'تحاليل (Lab Results)' },
  { value: 'report', label: 'تقرير طبي (Medical Report)' },
  { value: 'prescription', label: 'روشتة سابقة (Prescription)' },
  { value: 'image', label: 'صورة سريرية (Clinical Photo)' },
  { value: 'video', label: 'فيديو (Video)' },
  { value: 'consent', label: 'إقرار وموافقة (Consent Form)' },
  { value: 'other', label: 'أخرى (Other)' },
];

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  radiology: <FlaskConical size={14} />,
  lab:        <FlaskConical size={14} />,
  report:     <FileText size={14} />,
  prescription: <FileCheck size={14} />,
  image:      <Image size={14} />,
  video:      <Film size={14} />,
  consent:    <FileCheck size={14} />,
  referral:   <Send size={14} />,
  other:      <FolderOpen size={14} />,
};

const CATEGORY_COLOR: Record<string, string> = {
  radiology: 'purple',
  lab: 'cyan',
  report: 'blue',
  prescription: 'green',
  image: 'magenta',
  video: 'volcano',
  consent: 'lime',
  referral: 'geekblue',
  other: 'default',
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const DEFAULT_DEMO_FILES: PatientFile[] = [
  {
    id: 'f-1',
    file_name: 'Dental_Panoramic_OPG_XRay.jpg',
    mime_type: 'image/jpeg',
    size_bytes: 2450000,
    category: 'radiology',
    description: 'أشعة بانوراما كاملة للفكين قبل بدء خطة العلاج',
    tags: ['OPG', 'Dental', 'Jaw'],
    is_archived: false,
    visit_id: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'f-2',
    file_name: 'CBC_Comprehensive_Blood_Test.pdf',
    mime_type: 'application/pdf',
    size_bytes: 840000,
    category: 'lab',
    description: 'تحليل دم كامل وسكر تراكمي HbA1c',
    tags: ['CBC', 'HbA1c', 'Lab'],
    is_archived: false,
    visit_id: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

interface FilesTabProps {
  patientId: string;
  readonly?: boolean;
}

export function FilesTab({ patientId, readonly = false }: FilesTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [files, setFiles] = useState<PatientFile[]>(() => {
    try {
      const raw = localStorage.getItem(`patient_files_${patientId}`);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_DEMO_FILES;
  });

  const saveFiles = (updated: PatientFile[]) => {
    setFiles(updated);
    try {
      localStorage.setItem(`patient_files_${patientId}`, JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const handleArchive = (fileId: string) => {
    const updated = files.filter((f) => f.id !== fileId);
    saveFiles(updated);
    message.success('تمت أرشفة الملف');
  };

  const handleDownload = (file: PatientFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      const blob = new Blob([`Sample medical record for ${file.file_name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSave = async () => {
    const vals = await form.validateFields();
    const newFile: PatientFile = {
      id: `file-${Date.now()}`,
      file_name: selectedFileObj?.name || vals.fileName || 'Medical_Attachment.jpg',
      mime_type: selectedFileObj?.type || 'image/jpeg',
      size_bytes: selectedFileObj?.size || 1024 * 1024,
      category: vals.category || 'radiology',
      description: vals.description || '',
      tags: vals.tags || [],
      is_archived: false,
      visit_id: null,
      created_at: new Date().toISOString(),
      url: previewDataUrl || undefined,
    };

    saveFiles([newFile, ...files]);
    message.success('تم حفظ وإرفاق الملف بنجاح');
    setModalOpen(false);
    setSelectedFileObj(null);
    setPreviewDataUrl(null);
    form.resetFields();
  };

  const filteredFiles = categoryFilter
    ? files.filter((f) => f.category === categoryFilter)
    : files;

  const columns = [
    {
      title: 'الملف',
      key: 'file',
      render: (_: any, r: PatientFile) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: '#64748B' }}>{CATEGORY_ICON[r.category] || <FolderOpen size={16} />}</div>
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{r.file_name}</div>
            {r.description && (
              <div style={{ fontSize: 11, color: '#64748B' }}>{r.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'التصنيف',
      dataIndex: 'category',
      key: 'category',
      render: (val: string) => (
        <Tag color={CATEGORY_COLOR[val] || 'default'} style={{ textTransform: 'capitalize', borderRadius: 6 }}>
          {val.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'الحجم',
      dataIndex: 'size_bytes',
      key: 'size_bytes',
      render: (val: number) => <span style={{ fontSize: 12, color: '#64748B' }}>{formatBytes(val)}</span>,
    },
    {
      title: 'تاريخ الرفع',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => (
        <span style={{ fontSize: 12, color: '#64748B' }}>
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 130,
      render: (_: any, r: PatientFile) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {r.url && (
            <Tooltip title="معاينة">
              <Button
                size="small"
                type="text"
                icon={<Eye size={14} color="#2563EB" />}
                onClick={() => setPreviewModalUrl(r.url || null)}
              />
            </Tooltip>
          )}
          <Tooltip title="تحميل">
            <Button
              size="small"
              type="text"
              icon={<Download size={14} />}
              onClick={() => handleDownload(r)}
            />
          </Tooltip>
          {!readonly && (
            <Popconfirm title="أرشفة الملف؟" onConfirm={() => handleArchive(r.id)} okText="نعم" cancelText="لا">
              <Button
                size="small"
                type="text"
                icon={<Archive size={14} />}
                danger
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={18} color="#64748B" />
            <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>أرشيف الأشعات والتحاليل والمستندات</span>
          </div>
          <Select
            allowClear
            placeholder="جميع التصنيفات"
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            size="small"
          />
        </div>
        {!readonly && (
          <Button type="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)} size="small">
            إرفاق صورة / أشعة / تحليل
          </Button>
        )}
      </div>

      {filteredFiles.length === 0 ? (
        <EmptyState
          icon="folder"
          title="لا توجد ملفات مرفقة"
          description="ارفع صور الأشعة، نتائج التحاليل، الروشتات، والتقارير الطبية هنا."
          action={!readonly ? { label: 'إرفاق ملف الآن', onClick: () => setModalOpen(true) } : undefined}
        />
      ) : (
        <Table
          dataSource={filteredFiles}
          columns={columns}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 8 }}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        />
      )}

      {/* Upload Modal */}
      <Modal
        title="إرفاق أشعة أو تحليل أو مستند طبي"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedFileObj(null);
          setPreviewDataUrl(null);
          form.resetFields();
        }}
        onOk={handleSave}
        okText="حفظ وإرفاق"
        cancelText="إلغاء"
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 14 }}>
          <Form.Item label="الملف / الصورة">
            <Upload.Dragger
              multiple={false}
              beforeUpload={(file) => {
                setSelectedFileObj(file);
                form.setFieldsValue({ fileName: file.name });
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (e) => setPreviewDataUrl(e.target?.result as string);
                  reader.readAsDataURL(file);
                }
                return false;
              }}
              showUploadList={false}
            >
              {previewDataUrl ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={previewDataUrl} alt="preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8 }} />
                  <p style={{ marginTop: 8, fontSize: 12, color: '#059669' }}>✓ {selectedFileObj?.name}</p>
                </div>
              ) : (
                <div>
                  <FolderOpen size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <p className="ant-upload-text">اضغط أو اسحب الملف هنا (أشعة، صورة، PDF)</p>
                  <p className="ant-upload-hint">يدعم الصور من الموبايل والكومبيوتر مباشرة</p>
                </div>
              )}
            </Upload.Dragger>
          </Form.Item>
          <Form.Item name="fileName" label="اسم الملف" rules={[{ required: true }]}>
            <Input placeholder="مثال: أشعة سينية_الركبة_اليسرى.jpg" />
          </Form.Item>
          <Form.Item name="category" label="التصنيف" initialValue="radiology" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS} placeholder="اختر التصنيف" />
          </Form.Item>
          <Form.Item name="description" label="وصف أو ملاحظات الطبيب">
            <Input placeholder="مثال: أشعة رنين توضح خشونة الدرجة الثانية..." />
          </Form.Item>
          <Form.Item name="tags" label="وسوم (Tags)">
            <Select mode="tags" placeholder="مثال: أشعة, رنين, ركبة..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <Modal
          open={!!previewModalUrl}
          footer={null}
          onCancel={() => setPreviewModalUrl(null)}
          width={720}
          title="معاينة الصورة / الأشعة"
        >
          <div style={{ textAlign: 'center', padding: 10 }}>
            <AntImage src={previewModalUrl} alt="Medical Attachment" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        </Modal>
      )}
    </div>
  );
}
