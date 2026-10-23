import { Button, Card, Modal, Tag, Typography, Space, Tooltip, Input, Collapse } from 'antd';
import { useState } from 'react';
import { Zap, Search, ChevronDown } from 'lucide-react';

const { Text } = Typography;

export interface PresetItem {
  drugName: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface RxPreset {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  color: string;
  items: PresetItem[];
}

export const RX_PRESETS: RxPreset[] = [
  // ─── عام / General ───
  {
    id: 'cold',
    name: 'Upper Respiratory / Cold',
    nameAr: 'نزلة برد — كبار',
    category: 'عام',
    color: '#1D4ED8',
    items: [
      { drugName: 'Paracetamol 500mg', dose: '500mg', frequency: 'كل 8 ساعات', duration: '5 أيام' },
      { drugName: 'Cetirizine 10mg', dose: '10mg', frequency: 'مرة ليلاً', duration: '5 أيام' },
      { drugName: 'Pseudoephedrine 60mg', dose: '60mg', frequency: 'كل 12 ساعة', duration: '3 أيام' },
      { drugName: 'Guaifenesin 400mg', dose: '400mg', frequency: 'كل 8 ساعات', duration: '5 أيام' },
    ],
  },
  {
    id: 'urti_children',
    name: 'Upper Resp. — Children',
    nameAr: 'نزلة برد — أطفال',
    category: 'عام',
    color: '#7C3AED',
    items: [
      { drugName: 'Paracetamol Syrup 250mg/5ml', dose: 'حسب الوزن', frequency: 'كل 6 ساعات', duration: '3 أيام' },
      { drugName: 'Loratadine Syrup 5mg/5ml', dose: '5ml', frequency: 'مرة صباحاً', duration: '5 أيام' },
      { drugName: 'Saline Nasal Drops', dose: '2-3 قطرات', frequency: 'كل 4 ساعات', duration: '5 أيام' },
    ],
  },
  {
    id: 'gastro',
    name: 'Gastroenteritis / GIT',
    nameAr: 'التهاب معدي معوي',
    category: 'عام',
    color: '#F59E0B',
    items: [
      { drugName: 'Metronidazole 500mg', dose: '500mg', frequency: 'كل 8 ساعات', duration: '7 أيام' },
      { drugName: 'Domperidone 10mg', dose: '10mg', frequency: 'قبل الأكل كل 8 ساعات', duration: '5 أيام' },
      { drugName: 'ORS Sachets', dose: '1 كيس', frequency: 'بعد كل إسهال', duration: 'حسب الحالة' },
      { drugName: 'Smectite (Diosmectite)', dose: '3g', frequency: 'مرتين يومياً', duration: '5 أيام' },
    ],
  },
  {
    id: 'hypertension',
    name: 'Hypertension — Starter',
    nameAr: 'ارتفاع ضغط الدم',
    category: 'عام',
    color: '#B91C1C',
    items: [
      { drugName: 'Amlodipine 5mg', dose: '5mg', frequency: 'مرة صباحاً', duration: '30 يوم' },
      { drugName: 'Losartan 50mg', dose: '50mg', frequency: 'مرة صباحاً', duration: '30 يوم' },
      { drugName: 'Aspirin 81mg', dose: '81mg', frequency: 'مرة ليلاً', duration: '30 يوم' },
    ],
  },
  {
    id: 'diabetes_t2',
    name: 'DM Type 2 — Starter',
    nameAr: 'سكر النوع الثاني',
    category: 'عام',
    color: '#047857',
    items: [
      { drugName: 'Metformin 500mg', dose: '500mg', frequency: 'مع الأكل مرتين', duration: '30 يوم' },
      { drugName: 'Gliclazide MR 30mg', dose: '30mg', frequency: 'مرة صباحاً مع الفطار', duration: '30 يوم' },
      { drugName: 'Atorvastatin 20mg', dose: '20mg', frequency: 'مرة ليلاً', duration: '30 يوم' },
    ],
  },
  // ─── أسنان / Dental ───
  {
    id: 'post_extraction',
    name: 'Post-Extraction',
    nameAr: 'بعد الخلع',
    category: 'أسنان',
    color: '#0369A1',
    items: [
      { drugName: 'Amoxicillin 500mg', dose: '500mg', frequency: 'كل 8 ساعات', duration: '5 أيام' },
      { drugName: 'Ibuprofen 400mg', dose: '400mg', frequency: 'كل 8 ساعات', duration: '3 أيام' },
      { drugName: 'Metronidazole 250mg', dose: '250mg', frequency: 'كل 8 ساعات', duration: '5 أيام' },
      { drugName: 'Chlorhexidine Mouthwash 0.12%', dose: '15ml', frequency: 'مضمضة مرتين يومياً', duration: '7 أيام' },
    ],
  },
  {
    id: 'pulpitis',
    name: 'Pulpitis / Root Canal',
    nameAr: 'التهاب عصب — قبل العصب',
    category: 'أسنان',
    color: '#6D28D9',
    items: [
      { drugName: 'Amoxicillin + Clavulanate 625mg', dose: '625mg', frequency: 'كل 12 ساعة', duration: '7 أيام' },
      { drugName: 'Ibuprofen 600mg', dose: '600mg', frequency: 'كل 8 ساعات للألم', duration: '3 أيام' },
      { drugName: 'Paracetamol 1g', dose: '1g', frequency: 'كل 8 ساعات إضافي للألم', duration: '3 أيام' },
    ],
  },
  // ─── جلدية / Derma ───
  {
    id: 'acne_mild',
    name: 'Acne Vulgaris — Mild',
    nameAr: 'حب شباب خفيف',
    category: 'جلدية',
    color: '#F97316',
    items: [
      { drugName: 'Clindamycin + Benzoyl Peroxide Gel 1%/5%', dose: 'طبقة رقيقة', frequency: 'مرة ليلاً على الجلد', duration: '3 أشهر' },
      { drugName: 'Adapalene Gel 0.1%', dose: 'طبقة رقيقة', frequency: 'مرة ليلاً', duration: '3 أشهر' },
      { drugName: 'Oil-free Sunscreen SPF50', dose: 'مناسبة', frequency: 'صباحاً', duration: 'مستمر' },
    ],
  },
  {
    id: 'eczema',
    name: 'Atopic Eczema',
    nameAr: 'إكزيما تأتبية',
    category: 'جلدية',
    color: '#BE185D',
    items: [
      { drugName: 'Mometasone Cream 0.1%', dose: 'طبقة رقيقة', frequency: 'مرة يومياً على المنطقة', duration: '2 أسبوع' },
      { drugName: 'Cetirizine 10mg', dose: '10mg', frequency: 'مرة ليلاً', duration: '2 أسبوع' },
      { drugName: 'Moisturizing Cream (Emollient)', dose: 'وافر', frequency: '3 مرات يومياً', duration: 'مستمر' },
    ],
  },
  // ─── عيون / Ophthalmology ───
  {
    id: 'conjunctivitis_bact',
    name: 'Bacterial Conjunctivitis',
    nameAr: 'رمد جرثومي',
    category: 'عيون',
    color: '#0891B2',
    items: [
      { drugName: 'Tobramycin Eye Drops 0.3%', dose: '1-2 قطرة', frequency: 'كل 4 ساعات لمدة 2 يوم ثم 3 مرات', duration: '7 أيام' },
      { drugName: 'Artificial Tears', dose: '1-2 قطرة', frequency: 'كل 4 ساعات', duration: '7 أيام' },
    ],
  },
  // ─── علاج طبيعي / Physio ───
  {
    id: 'lbp',
    name: 'Low Back Pain',
    nameAr: 'آلام أسفل الظهر',
    category: 'علاج طبيعي',
    color: '#047857',
    items: [
      { drugName: 'Diclofenac 50mg', dose: '50mg', frequency: 'كل 12 ساعة مع الأكل', duration: '5 أيام' },
      { drugName: 'Methocarbamol 750mg', dose: '750mg', frequency: 'كل 8 ساعات', duration: '5 أيام' },
      { drugName: 'Omeprazole 20mg', dose: '20mg', frequency: 'صباحاً قبل الأكل', duration: '5 أيام' },
    ],
  },
  // ─── نسا وتوليد / Gynecology ───
  {
    id: 'utitreament',
    name: 'UTI — Uncomplicated',
    nameAr: 'التهاب مسالك بولية',
    category: 'نسا وتوليد',
    color: '#DB2777',
    items: [
      { drugName: 'Nitrofurantoin 100mg MR', dose: '100mg', frequency: 'مرتين يومياً', duration: '5 أيام' },
      { drugName: 'Phenazopyridine 200mg', dose: '200mg', frequency: 'كل 8 ساعات للألم', duration: '2 يوم' },
      { drugName: 'Cranberry Extract 500mg', dose: '500mg', frequency: 'مرتين يومياً', duration: '30 يوم للوقاية' },
    ],
  },
];

interface PrescriptionPresetsProps {
  onApplyPreset: (items: PresetItem[]) => void;
}

export function PrescriptionPresets({ onApplyPreset }: PrescriptionPresetsProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const categories = [...new Set(RX_PRESETS.map((p) => p.category))];

  const filteredPresets = search.trim()
    ? RX_PRESETS.filter(
        (p) =>
          p.nameAr.includes(search) ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.includes(search)
      )
    : RX_PRESETS;

  const groupedByCategory = categories
    .map((cat) => ({
      cat,
      presets: filteredPresets.filter((p) => p.category === cat),
    }))
    .filter((g) => g.presets.length > 0);

  return (
    <>
      <Tooltip title="روشتات جاهزة للحالات الشائعة — ضغطة واحدة تملأ الروشتة">
        <Button
          size="small"
          icon={<Zap size={13} />}
          style={{
            borderRadius: 8,
            fontSize: 11,
            backgroundColor: '#FFF7ED',
            borderColor: '#FED7AA',
            color: '#C2410C',
            fontWeight: 600,
          }}
          onClick={() => setOpen(true)}
        >
          روشتات جاهزة
        </Button>
      </Tooltip>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="#C2410C" />
            <span>روشتات جاهزة — اضغط لتطبيق فوري</span>
          </div>
        }
        open={open}
        onCancel={() => { setOpen(false); setSearch(''); }}
        footer={null}
        width={680}
      >
        <Input
          prefix={<Search size={14} color="#64748B" />}
          placeholder="ابحث بالاسم أو التخصص..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 16 }}
        />

        <div style={{ maxHeight: 480, overflowY: 'auto', paddingInlineEnd: 4 }}>
          <Collapse
            defaultActiveKey={categories}
            ghost
            expandIcon={({ isActive }) => <ChevronDown size={14} style={{ transform: isActive ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
            items={groupedByCategory.map(({ cat, presets }) => ({
              key: cat,
              label: (
                <Text strong style={{ fontSize: 13 }}>
                  {cat} ({presets.length})
                </Text>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presets.map((preset) => (
                    <Card
                      key={preset.id}
                      size="small"
                      style={{
                        borderRadius: 10,
                        border: `1px solid ${preset.color}30`,
                        backgroundColor: `${preset.color}08`,
                        cursor: 'pointer',
                      }}
                      hoverable
                      onClick={() => {
                        onApplyPreset(preset.items);
                        setOpen(false);
                        setSearch('');
                      }}
                      extra={
                        <Button
                          size="small"
                          type="primary"
                          style={{ backgroundColor: preset.color, borderColor: preset.color, borderRadius: 8, fontSize: 11 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyPreset(preset.items);
                            setOpen(false);
                            setSearch('');
                          }}
                        >
                          تطبيق ⚡
                        </Button>
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 13, color: preset.color }}>{preset.nameAr}</Text>
                        <Tag style={{ fontSize: 10, margin: 0, color: preset.color, borderColor: `${preset.color}50`, backgroundColor: `${preset.color}10` }}>
                          {preset.name}
                        </Tag>
                      </div>
                      <Space size={[4, 4]} wrap>
                        {preset.items.map((item, i) => (
                          <Tag key={i} style={{ fontSize: 10, borderRadius: 6, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            {item.drugName} — {item.dose} — {item.frequency}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  ))}
                </div>
              ),
            }))}
          />
        </div>
      </Modal>
    </>
  );
}
