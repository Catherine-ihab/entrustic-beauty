import { Card, Form, Input, DatePicker, Select, Space, message } from 'antd';
import { FileText, Wand2 } from 'lucide-react';
import type { FormInstance } from 'antd';

interface VisitNoteEditorProps {
  form: FormInstance;
  readonly?: boolean;
}

const NOTE_TEMPLATES = [
  {
    label: 'Standard Consultation (SOAP)',
    value: 'soap',
    data: {
      chiefComplaint: 'Patient presents for routine clinical evaluation.',
      clinicalNotes: 'Subjective: Patient reports symptoms started 3 days ago.\nObjective: Physical examination unremarkable, vitals stable.',
      treatmentPlan: '1. Supportive care and observation.\n2. Prescribe indicated medication.\n3. Return if symptoms worsen.',
    },
  },
  {
    label: 'Follow-Up Progress Review',
    value: 'followup',
    data: {
      chiefComplaint: 'Scheduled follow-up assessment.',
      clinicalNotes: 'Patient demonstrates clinical improvement. Tolerating current regimen well without adverse effects.',
      treatmentPlan: 'Continue current therapy. Plan re-evaluation in 4 weeks.',
    },
  },
  {
    label: 'Pre-Procedure Assessment',
    value: 'pre_proc',
    data: {
      chiefComplaint: 'Pre-procedure clearance and evaluation.',
      clinicalNotes: 'Medical history reviewed. No contraindications identified. Risks and benefits discussed with patient.',
      treatmentPlan: 'Obtain informed consent. Proceed with planned intervention.',
    },
  },
];

export function VisitNoteEditor({ form, readonly = false }: VisitNoteEditorProps) {
  const handleApplyTemplate = (templateVal: string) => {
    const tpl = NOTE_TEMPLATES.find((t) => t.value === templateVal);
    if (!tpl) return;
    form.setFieldsValue(tpl.data);
    message.success(`Template applied: ${tpl.label}`);
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#2563EB" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Clinical Notes & Treatment Plan</span>
          </div>

          {!readonly && (
            <Space size={6}>
              <Wand2 size={13} color="#64748B" />
              <Select
                placeholder="Insert Clinical Template..."
                style={{ width: 220 }}
                size="small"
                options={NOTE_TEMPLATES.map((t) => ({ label: t.label, value: t.value }))}
                onChange={handleApplyTemplate}
              />
            </Space>
          )}
        </div>
      }
      style={{ borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}
    >
      <Form.Item
        name="chiefComplaint"
        label="Chief Complaint / Reason for Visit"
        rules={[{ required: true, message: 'Please document chief complaint' }]}
        style={{ marginBottom: 14 }}
      >
        <Input
          placeholder="e.g. Sharp pain in lower right molar for 2 days; Persistent lower back stiffness..."
          disabled={readonly}
        />
      </Form.Item>

      <Form.Item
        name="clinicalNotes"
        label="Clinical Examination & Observations (SOAP / Findings)"
        rules={[{ required: true, message: 'Clinical observations required' }]}
        style={{ marginBottom: 14 }}
      >
        <Input.TextArea
          rows={4}
          placeholder="Document history of present illness, examination observations, diagnostic test review..."
          disabled={readonly}
        />
      </Form.Item>

      <Form.Item
        name="treatmentPlan"
        label="Treatment Plan, Orders & Patient Instructions"
        style={{ marginBottom: 14 }}
      >
        <Input.TextArea
          rows={3}
          placeholder="Document interventions ordered, patient counseling, home care instructions..."
          disabled={readonly}
        />
      </Form.Item>

      <Form.Item name="followUpDate" label="Recommended Follow-Up Date" style={{ marginBottom: 0 }}>
        <DatePicker style={{ width: 220 }} placeholder="Select follow-up date" disabled={readonly} />
      </Form.Item>
    </Card>
  );
}
