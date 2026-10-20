import React, { useState, useMemo } from 'react';
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
  Radio,
  Alert,
} from 'antd';
import {
  Sparkles,
  Layers,
  Activity,
  History,
  Plus,
  Cpu,
  Gift,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useLang } from '../../lib/useLang';
import { QueueBanner } from '../../components/QueueBanner';
import { QueueEntry, finishQueueSessionByPatient } from '../../lib/clinicQueue';
import { consumeInventoryStock } from '../../lib/clinicInventory';
import { recordDoctorSessionEarning } from '../../lib/doctorEarnings';
import { redeemPackageSessionForPatient } from '../../lib/packagesDirectory';

const { Title, Text } = Typography;

// --- Interfaces for Priced Items ---
export interface PricedFaceMask {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description: string;
}

export interface PricedFacialDevice {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description: string;
}

export interface FacialBundle {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  maskIds: string[];
  deviceIds: string[];
  badge: string;
}

export interface FacialTreatmentRecord {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  sessionType: 'باقة جاهزة' | 'خدمات متفرقة';
  bundleOrItemsName: string;
  selectedMasks: string[];
  selectedDevices: string[];
  totalPriceEgp: number;
  immediateReaction: string;
  patientComfort: string;
  practitioner: string;
  notes: string;
}

// --- Pre-configured Priced Catalogs ---
const DEFAULT_PRICED_MASKS: PricedFaceMask[] = [
  {
    id: 'mask-gold-24k',
    name: 'ماسك الذهب عيار 24K الفاخر للشد والتألق',
    price: 400,
    durationMin: 20,
    description: 'تحفيز الكولاجين، شد البشرة وإضفاء لمعان وتوهج ملكي',
  },
  {
    id: 'mask-hydrogel-ha',
    name: 'ماسك الهيدروجيل بحمض الهيالورونيك المركز',
    price: 250,
    durationMin: 20,
    description: 'ترطيب عميق لخلايا البشرة وتهدئة الخطوط الدقيقة والجفاف',
  },
  {
    id: 'mask-charcoal-clay',
    name: 'ماسك الفحم والطمي البركاني لتنقية المسام',
    price: 200,
    durationMin: 15,
    description: 'امتصاص الدهون الفائضة وشفط الرؤوس السوداء من منطقة T-Zone',
  },
  {
    id: 'mask-collagen-marine',
    name: 'ماسك الكولاجين البحري والإيلاستين',
    price: 300,
    durationMin: 20,
    description: 'استعادة مرونة الجلد وامتلاء الخدود ومقاومة علامات التقدم بالسن',
  },
  {
    id: 'mask-vit-c-glow',
    name: 'ماسك فيتامين C والنياسيناميد للتفتيح والنضارة',
    price: 250,
    durationMin: 15,
    description: 'تفتيح البقع السطحية وآثار الحبوب ومضاد أكسدة فائق',
  },
  {
    id: 'mask-green-tea-aloe',
    name: 'ماسك الشاي الأخضر والألوفيرا للبشرة الحساسة',
    price: 200,
    durationMin: 15,
    description: 'تهدئة الاحمرار وتبريد الجلد بعد التقشير أو إزالة الشعر',
  },
  {
    id: 'mask-alginate-lavender',
    name: 'ماسك الألجينات المطاطي باللافندر لغلق المسام',
    price: 350,
    durationMin: 25,
    description: 'قناع مطاطي يغلق المسام ويزيد امتصاص السيرومات بنسبة 80%',
  },
  {
    id: 'mask-salicylic-bha',
    name: 'ماسك حمض الساليسيليك الطبي BHA للحبوب',
    price: 250,
    durationMin: 15,
    description: 'تنظيف مسامات حب الشباب وتقليل الإفراز الدهني',
  },
];

const DEFAULT_PRICED_DEVICES: PricedFacialDevice[] = [
  {
    id: 'dev-hydrafacial',
    name: 'جهاز هيدرافيشل سينديو الأصلي (HydraFacial Syndeo)',
    price: 600,
    durationMin: 30,
    description: 'تقشير مائي، شفط دهون وتفريغ مسام مع ضخ سيرومات مغذية',
  },
  {
    id: 'dev-led-mask',
    name: 'قناع الضوء العلاجي للوجه LED Mask (7 ألوان)',
    price: 250,
    durationMin: 15,
    description: 'علاج ضوئي أحمر للنضارة أو أزرق للتعقيم أو أخضر للتصبغات',
  },
  {
    id: 'dev-dermapen-4',
    name: 'جهاز ديرمابن 4 الطبي للوجه (Dermapen 4)',
    price: 800,
    durationMin: 40,
    description: 'ميكرونيدلينج طبي دقيق لتحفيز الكولاجين وتضييق المسام',
  },
  {
    id: 'dev-carbon-laser',
    name: 'ليزر كربوني نضارة الوجه (Carbon Laser Q-Switch)',
    price: 700,
    durationMin: 30,
    description: 'جلسة هوليوود الشهيرة لتقشير الخلايا الميتة وتفتيح الوجه',
  },
  {
    id: 'dev-ultrasonic-scrubber',
    name: 'جهاز تنظيف المسام بالموجات فوق الصوتية (Skin Scrubber)',
    price: 200,
    durationMin: 15,
    description: 'تفتيت الدهون والترسبات في مسامات الأنف والذقن',
  },
  {
    id: 'dev-cryo-hammer',
    name: 'مطرقة التبريد لغلق المسام (Cryo Cold Hammer)',
    price: 150,
    durationMin: 10,
    description: 'تبريد الجلد عند 2-5 درجات لغلق المسام وحبس السيروم بالبشرة',
  },
  {
    id: 'dev-high-frequency',
    name: 'عصا التردد العالي لتعقيم البثور (High Frequency Wand)',
    price: 150,
    durationMin: 10,
    description: 'توليد الأوزون لقتل بكتيريا حب الشباب وتطهير المسام المفتوحة',
  },
  {
    id: 'dev-facial-steamer',
    name: 'جهاز البخار والأوزون الطبي لفتح المسام',
    price: 100,
    durationMin: 10,
    description: 'تبخير دافئ لتليين الدهون والرؤوس السوداء قبل الشفط',
  },
];

// Pre-priced Ready Facial Bundles
const DEFAULT_FACIAL_BUNDLES: FacialBundle[] = [
  {
    id: 'bundle-royal-gold',
    name: '👑 باكدج هيدرافيشل الملكي وقناع الذهب 24K',
    price: 1200,
    originalPrice: 1550,
    description: 'تنظيف مائي هيدرافيشل كامل + ماسك الذهب عيار 24K + قناع الضوء LED + مطرقة التبريد',
    maskIds: ['mask-gold-24k'],
    deviceIds: ['dev-hydrafacial', 'dev-led-mask', 'dev-cryo-hammer'],
    badge: 'الأكثر طلباً - وفّر 350 ج.م',
  },
  {
    id: 'bundle-acne-clear',
    name: '🌿 باكدج تنقية المسام وعلاج حب الشباب المكثف',
    price: 850,
    originalPrice: 1100,
    description: 'تنظيف مسام بالموجات + تفريغ دهون + ماسك الطمي البركاني + تعقيم High Frequency + قناع LED أزرق',
    maskIds: ['mask-charcoal-clay'],
    deviceIds: ['dev-ultrasonic-scrubber', 'dev-high-frequency', 'dev-led-mask'],
    badge: 'علاجي معتمد - وفّر 250 ج.م',
  },
  {
    id: 'bundle-hydra-glow',
    name: '💧 باكدج الترطيب الفائق والنضارة الفورية (Glow Boost)',
    price: 750,
    originalPrice: 950,
    description: 'تقشير مائي لطيف + ماسك الهيدروجيل بالهيالورونيك المركز + مطرقة التبريد وسيروم النضارة',
    maskIds: ['mask-hydrogel-ha'],
    deviceIds: ['dev-hydrafacial', 'dev-cryo-hammer'],
    badge: 'نضارة سريعة - وفّر 200 ج.م',
  },
  {
    id: 'bundle-dermapen-collagen',
    name: '🎯 باكدج ديرمابن الكولاجين وماسك الكولاجين البحري',
    price: 1400,
    originalPrice: 1750,
    description: 'جلسة ديرمابن 4 للوجه + ميزوثيرابي + ماسك الكولاجين البحري المهدئ + قناع LED ضوء أحمر',
    maskIds: ['mask-collagen-marine'],
    deviceIds: ['dev-dermapen-4', 'dev-led-mask'],
    badge: 'شد وتجديد خلايا - وفّر 350 ج.م',
  },
  {
    id: 'bundle-carbon-peel',
    name: '✨ باكدج هوليوود للوجه (ليزر كربوني + ماسك فيتامين C)',
    price: 1100,
    originalPrice: 1350,
    description: 'ليزر كربوني Q-Switch لتنظيف الخلايا الميتة + ماسك فيتامين C للتفتيح + قناع LED أخضر',
    maskIds: ['mask-vit-c-glow'],
    deviceIds: ['dev-carbon-laser', 'dev-led-mask'],
    badge: 'تفتيح وتوحيد لون - وفّر 250 ج.م',
  },
];

const DEFAULT_SKIN_CONDITIONS = [
  { value: 'Dehydrated & Congested T-Zone', label: 'جفاف البشرة وانسداد مسام منطقة T-Zone' },
  { value: 'Active Acne Papulopustular', label: 'حب شباب نشط وبثور ملتهبة (Active Acne)' },
  { value: 'Melasma & Hyperpigmentation', label: 'كلف وتصبغات سطحية بالوجه (Melasma)' },
  { value: 'Atrophic Acne Scarring & Large Pores', label: 'مسام واسعة وندبات حب شباب (Large Pores)' },
  { value: 'Skin Dullness & Loss of Glow', label: 'بهتان وشحوب البشرة وفقدان النضارة (Dullness)' },
  { value: 'Facial Laxity & Fine Lines', label: 'ترهل خفيف وخطوط دقيقة بالوجه (Fine Lines)' },
  { value: 'Rosacea & Sensitive Redness', label: 'وردية وحساسية واحمرار الوجه (Rosacea)' },
];

const DEFAULT_GLOGAU_OPTIONS = [
  { value: 'Glogau I (Mild - No Wrinkles)', label: 'Glogau I: شيخوخة ضوئية خفيفة (عمر 20-30، بدون تجاعيد)' },
  { value: 'Glogau II (Moderate - Early Wrinkles)', label: 'Glogau II: متوسطة (عمر 30-40، خطوط تعبيرية حركية)' },
  { value: 'Glogau III (Advanced - Persistent Wrinkles)', label: 'Glogau III: متقدمة (عمر 50+، تجاعيد في وضع السكون)' },
  { value: 'Glogau IV (Severe - Pervasive Wrinkling)', label: 'Glogau IV: شديدة (عمر 60+، ترهل وتجاعيد عميقة)' },
];

const LS_PRICED_MASKS = 'clinic_skincare_priced_masks_v3';
const LS_PRICED_DEVICES = 'clinic_skincare_priced_devices_v3';
const LS_PRICED_BUNDLES = 'clinic_skincare_priced_bundles_v3';

export const SkinCareWorkspaceView: React.FC = () => {
  const { tx } = useLang();

  // Mode: Ready Package vs A La Carte (حاجات متفرقة)
  const [selectionMode, setSelectionMode] = useState<'bundle' | 'custom'>('bundle');
  const [selectedBundleId, setSelectedBundleId] = useState<string>('bundle-royal-gold');

  // Lists of Priced Masks & Devices
  const [pricedMasks, setPricedMasks] = useState<PricedFaceMask[]>(() => {
    try {
      const stored = localStorage.getItem(LS_PRICED_MASKS);
      return stored ? JSON.parse(stored) : DEFAULT_PRICED_MASKS;
    } catch {
      return DEFAULT_PRICED_MASKS;
    }
  });

  const [pricedDevices, setPricedDevices] = useState<PricedFacialDevice[]>(() => {
    try {
      const stored = localStorage.getItem(LS_PRICED_DEVICES);
      return stored ? JSON.parse(stored) : DEFAULT_PRICED_DEVICES;
    } catch {
      return DEFAULT_PRICED_DEVICES;
    }
  });

  const [bundles] = useState<FacialBundle[]>(() => {
    try {
      const stored = localStorage.getItem(LS_PRICED_BUNDLES);
      return stored ? JSON.parse(stored) : DEFAULT_FACIAL_BUNDLES;
    } catch {
      return DEFAULT_FACIAL_BUNDLES;
    }
  });

  // Checkbox selections for A La Carte items
  const [checkedMaskIds, setCheckedMaskIds] = useState<string[]>(['mask-gold-24k']);
  const [checkedDeviceIds, setCheckedDeviceIds] = useState<string[]>([
    'dev-hydrafacial',
    'dev-led-mask',
  ]);

  // Skin condition & Glogau
  const [skinCondition, setSkinCondition] = useState<string>('Dehydrated & Congested T-Zone');
  const [glogauScale, setGlogauScale] = useState<string>('Glogau II (Moderate - Early Wrinkles)');

  // Dynamic + Add modals state (with mandatory price)
  const [isAddMaskModalOpen, setIsAddMaskModalOpen] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [maskForm] = Form.useForm();
  const [deviceForm] = Form.useForm();

  // New session modal
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionForm] = Form.useForm();

  // Active bundle details
  const activeBundle = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) || bundles[0],
    [bundles, selectedBundleId]
  );

  // Dynamic price calculation
  const calculatedPrice = useMemo(() => {
    if (selectionMode === 'bundle') {
      return activeBundle.price;
    }
    const masksTotal = checkedMaskIds.reduce((sum, id) => {
      const mask = pricedMasks.find((m) => m.id === id);
      return sum + (mask?.price || 0);
    }, 0);
    const devicesTotal = checkedDeviceIds.reduce((sum, id) => {
      const dev = pricedDevices.find((d) => d.id === id);
      return sum + (dev?.price || 0);
    }, 0);
    return masksTotal + devicesTotal;
  }, [selectionMode, activeBundle, checkedMaskIds, checkedDeviceIds, pricedMasks, pricedDevices]);

  // Handle adding a new face mask (MANDATORY PRICE)
  const handleCreateMask = (values: any) => {
    const priceNum = Number(values.price);
    if (!priceNum || priceNum <= 0) {
      message.error(tx('عذراً، لا يمكن إضافة أي ماسك بدون تحديد سعر معتمد بالجنيه!', 'Mask price is required!'));
      return;
    }
    const newMask: PricedFaceMask = {
      id: `mask-${Date.now()}`,
      name: values.name.trim(),
      price: priceNum,
      durationMin: Number(values.durationMin) || 20,
      description: values.description?.trim() || tx('ماسك إكلينيكي معتمد', 'Clinical face mask'),
    };
    const updated = [...pricedMasks, newMask];
    setPricedMasks(updated);
    localStorage.setItem(LS_PRICED_MASKS, JSON.stringify(updated));
    setCheckedMaskIds((prev) => [...prev, newMask.id]);
    setIsAddMaskModalOpen(false);
    maskForm.resetFields();
    message.success(tx(`تم إضافة ماسك "${newMask.name}" بسعر ${newMask.price} ج.م بنجاح!`, `Added mask at ${newMask.price} EGP`));
  };

  // Handle adding a new facial device (MANDATORY PRICE)
  const handleCreateDevice = (values: any) => {
    const priceNum = Number(values.price);
    if (!priceNum || priceNum <= 0) {
      message.error(tx('عذراً، لا يمكن إضافة جهاز أو خدمة بدون تحديد سعر الجلسة بالجنيه!', 'Device session price is required!'));
      return;
    }
    const newDevice: PricedFacialDevice = {
      id: `dev-${Date.now()}`,
      name: values.name.trim(),
      price: priceNum,
      durationMin: Number(values.durationMin) || 30,
      description: values.description?.trim() || tx('خدمة جهاز وجه معتمدة', 'Facial device procedure'),
    };
    const updated = [...pricedDevices, newDevice];
    setPricedDevices(updated);
    localStorage.setItem(LS_PRICED_DEVICES, JSON.stringify(updated));
    setCheckedDeviceIds((prev) => [...prev, newDevice.id]);
    setIsAddDeviceModalOpen(false);
    deviceForm.resetFields();
    message.success(tx(`تم إضافة جهاز "${newDevice.name}" بسعر ${newDevice.price} ج.م بنجاح!`, `Added device at ${newDevice.price} EGP`));
  };

  const LS_SKINCARE_SESSIONS = 'clinic_skincare_sessions_v2';
  const DEFAULT_SKINCARE_RECORDS: FacialTreatmentRecord[] = [
    {
      id: 'ft-01',
      date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      patientName: 'مريم الصاوي',
      patientId: 'PAT-00120',
      sessionType: 'باقة جاهزة',
      bundleOrItemsName: 'باكدج هيدرافيشل الملكي وقناع الذهب 24K',
      selectedMasks: ['ماسك الذهب عيار 24K الفاخر'],
      selectedDevices: ['جهاز هيدرافيشل سينديو', 'قناع الضوء العلاجي للوجه LED'],
      totalPriceEgp: 1200,
      immediateReaction: 'نضارة فورية وتوهج للبشرة',
      patientComfort: 'مسترخية ومريحة جداً',
      practitioner: 'د. سارة القاضي',
      notes: 'جلسة تنظيف عميق ووضع سيروم كولاجين وماسك ذهب مع إغلاق المسام بمطرقة التبريد.',
    },
    {
      id: 'ft-02',
      date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
      patientName: 'رانيا توفيق',
      patientId: 'PAT-00055',
      sessionType: 'باقة جاهزة',
      bundleOrItemsName: 'باكدج تنقية المسام وعلاج حب الشباب المكثف',
      selectedMasks: ['ماسك الفحم والطمي البركاني'],
      selectedDevices: ['جهاز تنظيف المسام بالموجات', 'عصا التردد العالي', 'قناع LED أزرق'],
      totalPriceEgp: 850,
      immediateReaction: 'تنظيف كامل للمسام مع حمرة خفيفة عابرة',
      patientComfort: 'مريحة',
      practitioner: 'د. مريم فاروق',
      notes: 'تفريغ مسام منطقة الأنف والجبين بنجاح وتهدئة الجلد بسيروم مهدئ وواقي شمس.',
    },
    {
      id: 'ft-03',
      date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'),
      patientName: 'هبة المنشاوي',
      patientId: 'PAT-00089',
      sessionType: 'خدمات متفرقة',
      bundleOrItemsName: 'اختيار متفرق (ماسك الهيدروجيل + ليزر كربوني + مطرقة تبريد)',
      selectedMasks: ['ماسك الهيدروجيل بحمض الهيالورونيك'],
      selectedDevices: ['ليزر كربوني نضارة الوجه', 'مطرقة التبريد لغلق المسام'],
      totalPriceEgp: 1100,
      immediateReaction: 'تهدئة فورية للبثور وترطيب عميق',
      patientComfort: 'ممتازة',
      practitioner: 'د. سارة القاضي',
      notes: 'تم التقشير بالليزر وتطبيق ماسك الهيدروجيل مع التبريد وواقي الشمس.',
    },
  ];

  // Sessions ledger
  const [records, setRecords] = useState<FacialTreatmentRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LS_SKINCARE_SESSIONS) || localStorage.getItem('skincare_sessions_history_v2');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_SKINCARE_RECORDS;
  });

  const saveRecords = (next: FacialTreatmentRecord[]) => {
    setRecords(next);
    localStorage.setItem(LS_SKINCARE_SESSIONS, JSON.stringify(next));
    localStorage.setItem('skincare_sessions_history_v2', JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSaveSession = (values: any) => {
    let bundleOrItemsName = '';
    let chosenMasks: string[] = [];
    let chosenDevices: string[] = [];

    if (selectionMode === 'bundle') {
      bundleOrItemsName = activeBundle.name;
      chosenMasks = activeBundle.maskIds.map((id) => pricedMasks.find((m) => m.id === id)?.name || id);
      chosenDevices = activeBundle.deviceIds.map((id) => pricedDevices.find((d) => d.id === id)?.name || id);
    } else {
      bundleOrItemsName = tx(
        `خدمات وماسكات متفرقة (${checkedMaskIds.length} ماسك + ${checkedDeviceIds.length} جهاز)`,
        `Custom Items (${checkedMaskIds.length} masks + ${checkedDeviceIds.length} devices)`
      );
      chosenMasks = checkedMaskIds.map((id) => pricedMasks.find((m) => m.id === id)?.name || id);
      chosenDevices = checkedDeviceIds.map((id) => pricedDevices.find((d) => d.id === id)?.name || id);
    }

    const newRecord: FacialTreatmentRecord = {
      id: `ft-${Date.now()}`,
      date: dayjs().format('YYYY-MM-DD'),
      patientName: values.patientName || tx('عميلة تجريبية', 'Test Client'),
      patientId: values.patientId || 'PAT-00215',
      sessionType: selectionMode === 'bundle' ? 'باقة جاهزة' : 'خدمات متفرقة',
      bundleOrItemsName,
      selectedMasks: chosenMasks,
      selectedDevices: chosenDevices,
      totalPriceEgp: calculatedPrice,
      immediateReaction: values.immediateReaction || tx('نضارة وتألق فوري للبشرة', 'Immediate skin glow'),
      patientComfort: values.patientComfort || tx('مسترخية ومريحة جداً', 'Very comfortable'),
      practitioner: values.practitioner || tx('د. سارة القاضي', 'Dr. Sarah El-Kady'),
      notes: values.notes || tx('تمت الجلسة بنجاح وتطبيق واقي الشمس المرطب.', 'Facial session completed successfully.'),
    };

    saveRecords([newRecord, ...records]);

    // 1. Deduct chosen masks & post-care cream from inventory (idempotent with session ID)
    chosenMasks.forEach((mName) => {
      consumeInventoryStock(mName, 1, newRecord.patientName, newRecord.id, 'ماسك عناية بالبشرة');
    });
    consumeInventoryStock('كريم بانثينول', 1, newRecord.patientName, newRecord.id, 'مرطب ما بعد الجلسة');

    // 2. Automatically record Doctor / Practitioner Commission (idempotent)
    recordDoctorSessionEarning({
      sessionRefId: newRecord.id,
      doctorName: newRecord.practitioner,
      patientId: newRecord.patientId,
      patientName: newRecord.patientName,
      serviceName: `عناية بالبشرة: ${newRecord.bundleOrItemsName}`,
      serviceCategory: 'عناية بالبشرة وهيدرافيشل',
      servicePriceEgp: calculatedPrice || 1200,
      date: newRecord.date,
      notes: `ماسكات: ${newRecord.selectedMasks.join(', ')}`,
    });

    // 3. Deduct/Redeem package session credit if patient has active package
    const redeemRes = redeemPackageSessionForPatient(newRecord.patientName, 'عناية بالبشرة');
    if (redeemRes.success) {
      message.info(`🎟️ ${redeemRes.message}`);
    }

    // 4. Mark completed in daily queue
    finishQueueSessionByPatient(newRecord.patientName, newRecord.notes);

    message.success(
      tx(
        `✅ تم حفظ الجلسة، واحتساب مستحقات الأخصائية، وتحديث الباقات والمخزن واكتمال الطابور! التكلفة: ${calculatedPrice.toLocaleString()} ج.م`,
        `Saved session, credited commission, updated packages & inventory & completed queue! Cost: ${calculatedPrice.toLocaleString()} EGP`
      )
    );
    setModalVisible(false);
    sessionForm.resetFields();
  };

  const columns = [
    {
      title: tx('التاريخ والنوع', 'Date & Type'),
      key: 'type',
      width: 160,
      render: (_: any, r: FacialTreatmentRecord) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{dayjs(r.date).format('DD MMM YYYY')}</Text>
          <Tag color={r.sessionType === 'باقة جاهزة' ? 'purple' : 'cyan'}>
            {r.sessionType === 'باقة جاهزة' ? '👑 باقة جاهزة' : '🧩 متفرق'}
          </Tag>
        </Space>
      ),
    },
    {
      title: tx('العميلة / الحالة', 'Client / Patient'),
      key: 'patient',
      render: (_: any, r: FacialTreatmentRecord) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.patientName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.patientId}</Text>
        </div>
      ),
    },
    {
      title: tx('تفاصيل الباقة / الماسكات والأجهزة', 'Package / Masks & Devices Details'),
      key: 'details',
      render: (_: any, r: FacialTreatmentRecord) => (
        <div>
          <div style={{ fontWeight: 600, color: '#be185d', fontSize: 13 }}>
            {r.bundleOrItemsName}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
            {tx('الماسكات:', 'Masks:')} {r.selectedMasks.join(' • ')}
          </div>
          <div style={{ fontSize: 11, color: '#0d9488', marginTop: 1 }}>
            {tx('الأجهزة:', 'Devices:')} {r.selectedDevices.join(' • ')}
          </div>
        </div>
      ),
    },
    {
      title: tx('السعر المعتمد', 'Approved Price'),
      key: 'price',
      width: 130,
      render: (_: any, r: FacialTreatmentRecord) => (
        <Tag color="green" style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
          {r.totalPriceEgp.toLocaleString()} ج.م
        </Tag>
      ),
    },
    {
      title: tx('الأخصائية', 'Practitioner'),
      dataIndex: 'practitioner',
      key: 'practitioner',
      render: (p: string) => <span style={{ fontSize: 12, fontWeight: 500 }}>{p}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner with Real-time Pricing Summary */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #db2777 100%)',
          borderRadius: 14,
          border: 'none',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(190, 24, 93, 0.25)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={15}>
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
                <Sparkles size={26} color="#ffffff" />
              </div>
              <div>
                <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {tx(
                    'منظومة عناية بشرة الوجه والماسكات المسعرة (Facial Care & Priced Masks)',
                    'Facial Care, Pre-Priced Masks & Device Protocols'
                  )}
                </Title>
                <Text style={{ color: '#fce7f3', fontSize: 13 }}>
                  {tx(
                    'اختيار إكلينيكي بين باقات العيادة الجاهزة أو خدمات وماسكات متفرقة مع تسعير معتمد ومحدد لكل بند',
                    'Choose between ready clinical facial bundles or a la carte priced masks & devices'
                  )}
                </Text>
              </div>
            </Space>
          </Col>

          {/* Pricing Highlight & Document Action */}
          <Col xs={24} md={9} style={{ textAlign: 'right' }}>
            <Space direction="vertical" align="end" size={8}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                  {tx('إجمالي سعر الجلسة المختارة:', 'Total Session Price:')}
                </span>
                <span style={{ color: '#831843', fontSize: 20, fontWeight: 800 }}>
                  {calculatedPrice.toLocaleString()} ج.م
                </span>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<Plus size={16} />}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#831843',
                  borderColor: '#ffffff',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                onClick={() => setModalVisible(true)}
              >
                {tx('+ تسجيل وحفظ الجلسة', '+ Document Facial Session')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Delay-Tolerant Synchronized Queue Banner */}
      <QueueBanner
        workspaceCategory="skincare"
        onSelectPatient={(q: QueueEntry) => {
          sessionForm.setFieldsValue({
            patientName: q.patientName,
            notes: q.packageName ? `${q.packageName} — جلسة ${q.packageSessionNumber || 1}` : q.serviceName,
          });
          setModalVisible(true);
        }}
      />

      {/* Mode Switcher: Ready Bundles vs A La Carte Checkboxes */}
      <Card
        size="small"
        style={{
          borderRadius: 12,
          border: '1px solid #fbcfe8',
          background: '#fff',
        }}
        bodyStyle={{ padding: '12px 18px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space size={12}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#334155' }}>
              {tx('طريقة اختيار الجلسة:', 'Session Selection Mode:')}
            </span>
            <Radio.Group
              value={selectionMode}
              onChange={(e) => setSelectionMode(e.target.value)}
              buttonStyle="solid"
              size="middle"
            >
              <Radio.Button value="bundle" style={{ fontWeight: 600 }}>
                <Space size={6}>
                  <Gift size={15} />
                  <span>{tx('👑 باقات عناية بالوجه جاهزة (Pre-set Packages)', 'Pre-set Facial Packages')}</span>
                </Space>
              </Radio.Button>
              <Radio.Button value="custom" style={{ fontWeight: 600 }}>
                <Space size={6}>
                  <Layers size={15} />
                  <span>{tx('🧩 اختيار ماسكات وأجهزة متفرقة بالبند (Checkboxes)', 'A La Carte Priced Checkboxes')}</span>
                </Space>
              </Radio.Button>
            </Radio.Group>
          </Space>

          <Alert
            type="info"
            showIcon
            message={
              selectionMode === 'bundle'
                ? tx('اختر الباقة الجاهزة المناسبة، وكل باقة محددة السعر وموفرة ومدرجة بالكتالوج.', 'Pre-priced package with bundle discount.')
                : tx('قم بتحديد الماسكات والأجهزة بالـ Checkbox، وممنوع إضافة أي بند بدون سعر معتمد.', 'All checkboxes are pre-priced. No unpriced items allowed.')
            }
            style={{ padding: '4px 12px', fontSize: 12, borderRadius: 8 }}
          />
        </div>
      </Card>

      {/* Main Workspace Layout */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Assessment & Selection (Bundles OR Checkboxes) */}
        <Col xs={24} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Skin Assessment */}
            <Card
              size="small"
              title={
                <Space>
                  <Activity size={16} color="#be185d" />
                  <span style={{ fontWeight: 700 }}>
                    {tx('1. تشخيص بشرة الوجه والمشكلة المستهدفة', '1. Facial Skin Assessment & Concerns')}
                  </span>
                </Space>
              }
              style={{ borderRadius: 12, border: '1px solid #fbcfe8' }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Text strong style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {tx('المشكلة المستهدفة في بشرة الوجه:', 'Primary Facial Concern:')}
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={skinCondition}
                    onChange={setSkinCondition}
                    options={DEFAULT_SKIN_CONDITIONS}
                  />
                </Col>
                <Col span={12}>
                  <Text strong style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 4 }}>
                    {tx('تصنيف مرونة البشرة (Glogau):', 'Glogau Photoaging Scale:')}
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={glogauScale}
                    onChange={setGlogauScale}
                    options={DEFAULT_GLOGAU_OPTIONS}
                  />
                </Col>
              </Row>
            </Card>

            {/* MODE A: PRE-PRICED READY BUNDLES */}
            {selectionMode === 'bundle' && (
              <Card
                size="small"
                title={
                  <Space>
                    <Gift size={16} color="#be185d" />
                    <span style={{ fontWeight: 700 }}>
                      {tx('2. باقات الوجه الجاهزة بالعيادة (Pre-Priced Packages)', '2. Clinic Ready-Made Packages')}
                    </span>
                  </Space>
                }
                style={{ borderRadius: 12, border: '1px solid #fbcfe8' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tx('اضغط على الباقة لاختيارها — تظهر جميع تفاصيل الماسكات والأجهزة المدرجة وسعر الباقة المعتمد:', 'Click any package to select it:')}
                  </Text>

                  {bundles.map((bundle) => {
                    const isSelected = selectedBundleId === bundle.id;
                    return (
                      <div
                        key={bundle.id}
                        onClick={() => setSelectedBundleId(bundle.id)}
                        style={{
                          border: isSelected ? '2px solid #be185d' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#fdf2f8' : '#ffffff',
                          borderRadius: 10,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(190, 24, 93, 0.12)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size={8}>
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                border: isSelected ? '5px solid #be185d' : '2px solid #CBD5E1',
                                backgroundColor: '#ffffff',
                              }}
                            />
                            <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? '#831843' : '#0F172A' }}>
                              {bundle.name}
                            </span>
                          </Space>
                          <Space size={6}>
                            <Tag color="magenta" style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
                              {bundle.price.toLocaleString()} ج.م
                            </Tag>
                            <span style={{ fontSize: 11, color: '#94A3B8', textDecoration: 'line-through' }}>
                              {bundle.originalPrice.toLocaleString()} ج.م
                            </span>
                          </Space>
                        </div>

                        <div style={{ fontSize: 12, color: '#475569', marginTop: 6, paddingRight: 26 }}>
                          {bundle.description}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingRight: 26 }}>
                          <Tag color="gold" style={{ fontSize: 11, borderRadius: 4 }}>
                            {bundle.badge}
                          </Tag>
                          <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 600 }}>
                            {bundle.maskIds.length} {tx('ماسك', 'mask')} + {bundle.deviceIds.length} {tx('أجهزة', 'devices')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* MODE B: A LA CARTE PRICED CHECKBOXES */}
            {selectionMode === 'custom' && (
              <>
                {/* 2. Face Masks Checkboxes (All Priced) */}
                <Card
                  size="small"
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Sparkles size={16} color="#db2777" />
                        <span style={{ fontWeight: 700 }}>
                          {tx('2. ماسكات الوجه المسعرة (Face Masks Checkboxes)', '2. Face Masks Checkboxes')}
                        </span>
                      </Space>
                      <Button
                        size="small"
                        type="link"
                        icon={<Plus size={12} />}
                        style={{ padding: 0, fontSize: 12, color: '#db2777', fontWeight: 700 }}
                        onClick={() => setIsAddMaskModalOpen(true)}
                      >
                        {tx('+ إضافة ماسك مسعر جديد', '+ Add Priced Mask')}
                      </Button>
                    </div>
                  }
                  style={{ borderRadius: 12, border: '1px solid #fbcfe8' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {tx('حددي الماسكات المطلوبة للجلسة (محددة السعر والمدة تلقائياً):', 'Check masks to include:')}
                    </Text>

                    {pricedMasks.map((mask) => {
                      const isChecked = checkedMaskIds.includes(mask.id);
                      return (
                        <div
                          key={mask.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            borderRadius: 8,
                            backgroundColor: isChecked ? '#fdf2f8' : '#F8FAFC',
                            border: isChecked ? '1px solid #f472b6' : '1px solid #E2E8F0',
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedMaskIds([...checkedMaskIds, mask.id]);
                              } else {
                                setCheckedMaskIds(checkedMaskIds.filter((id) => id !== mask.id));
                              }
                            }}
                          >
                            <span style={{ fontWeight: isChecked ? 700 : 500, fontSize: 13, color: '#1E293B' }}>
                              {mask.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>
                              {mask.durationMin} {tx('دقيقة', 'mins')} • {mask.description}
                            </span>
                          </Checkbox>

                          <Tag color="magenta" style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
                            {mask.price.toLocaleString()} ج.م
                          </Tag>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* 3. Facial Devices & Machines Checkboxes (All Priced) */}
                <Card
                  size="small"
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Cpu size={16} color="#0d9488" />
                        <span style={{ fontWeight: 700 }}>
                          {tx('3. أجهزة الوجه المسعرة (Facial Devices Checkboxes)', '3. Facial Devices Checkboxes')}
                        </span>
                      </Space>
                      <Button
                        size="small"
                        type="link"
                        icon={<Plus size={12} />}
                        style={{ padding: 0, fontSize: 12, color: '#0d9488', fontWeight: 700 }}
                        onClick={() => setIsAddDeviceModalOpen(true)}
                      >
                        {tx('+ إضافة جهاز مسعر جديد', '+ Add Priced Device')}
                      </Button>
                    </div>
                  }
                  style={{ borderRadius: 12, border: '1px solid #ccfbf1' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {tx('حددي أجهزة الوجه المستخدمة في الجلسة (كل جهاز بمدة وسعر رسمي):', 'Check devices to use:')}
                    </Text>

                    {pricedDevices.map((dev) => {
                      const isChecked = checkedDeviceIds.includes(dev.id);
                      return (
                        <div
                          key={dev.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            borderRadius: 8,
                            backgroundColor: isChecked ? '#f0fdfa' : '#F8FAFC',
                            border: isChecked ? '1px solid #5eead4' : '1px solid #E2E8F0',
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedDeviceIds([...checkedDeviceIds, dev.id]);
                              } else {
                                setCheckedDeviceIds(checkedDeviceIds.filter((id) => id !== dev.id));
                              }
                            }}
                          >
                            <span style={{ fontWeight: isChecked ? 700 : 500, fontSize: 13, color: '#1E293B' }}>
                              {dev.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>
                              {dev.durationMin} {tx('دقيقة', 'mins')} • {dev.description}
                            </span>
                          </Checkbox>

                          <Tag color="cyan" style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
                            {dev.price.toLocaleString()} ج.م
                          </Tag>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            )}

            {/* Financial Summary Card */}
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                background: '#F8FAFC',
              }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <DollarSign size={18} color="#0d9488" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                      {selectionMode === 'bundle'
                        ? tx(`باقة: ${activeBundle.name}`, `Bundle: ${activeBundle.name}`)
                        : tx(`العناصر المختارة: (${checkedMaskIds.length} ماسك + ${checkedDeviceIds.length} جهاز)`, `Items: (${checkedMaskIds.length} masks + ${checkedDeviceIds.length} devices)`)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {tx('تسعير معتمد وخاضع لفواتير الخزينة', 'Approved pricing subject to clinic invoicing')}
                    </div>
                  </div>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#be185d' }}>
                    {calculatedPrice.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Right Column: Sessions Ledger */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <History size={16} color="#be185d" />
                  <span style={{ fontWeight: 700 }}>
                    {tx('سجل جلسات بشرة الوجه والماسكات', 'Facial Care & Face Mask Session Records')}
                  </span>
                </Space>
                <Tag color="magenta">
                  {records.length} {tx('جلسات مسجلة', 'Sessions')}
                </Tag>
              </div>
            }
            style={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={records}
              rowKey="id"
              columns={columns}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 620 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Modal: Document New Facial Session */}
      <Modal
        title={
          <Space>
            <Sparkles size={18} color="#be185d" />
            <span style={{ fontWeight: 700 }}>
              {tx('تسجيل وتوثيق جلسة العناية بالوجه بالعيادة', 'Document Facial Care Session')}
            </span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => sessionForm.submit()}
        width={680}
        okText={tx(`تأكيد حفظ الجلسة (${calculatedPrice.toLocaleString()} ج.م)`, `Save Session (${calculatedPrice.toLocaleString()} EGP)`)}
        cancelText={tx('إلغاء', 'Cancel')}
      >
        <Form form={sessionForm} layout="vertical" onFinish={handleSaveSession} style={{ marginTop: 16 }}>
          <Alert
            type="success"
            showIcon
            icon={<CheckCircle2 size={16} />}
            message={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>
                  {selectionMode === 'bundle'
                    ? tx(`الباقة المحددة: ${activeBundle.name}`, `Selected: ${activeBundle.name}`)
                    : tx(`الخدمات المختارة: ${checkedMaskIds.length} ماسك + ${checkedDeviceIds.length} جهاز`, `Custom: ${checkedMaskIds.length} masks + ${checkedDeviceIds.length} devices`)}
                </span>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#be185d' }}>
                  {calculatedPrice.toLocaleString()} ج.م
                </span>
              </div>
            }
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="patientName"
                label={tx('اسم العميلة / الحالة:', 'Client / Patient Name:')}
                rules={[{ required: true, message: tx('برجاء إدخال اسم العميلة', 'Please enter client name') }]}
              >
                <Input placeholder={tx('مثال: مريم الصاوي', 'e.g. Maryam El-Sawy')} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="patientId" label={tx('كود الملف (ID):', 'Client File ID:')}>
                <Input placeholder="PAT-00215" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="practitioner"
                label={tx('الأخصائية المنفذة:', 'Practitioner:')}
                initialValue={tx('د. سارة القاضي', 'Dr. Sarah El-Kady')}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="immediateReaction"
                label={tx('نتيجة البشرة الفورية:', 'Immediate Skin Result:')}
                initialValue={tx('نضارة وتوهج فوري للبشرة', 'Immediate skin glow')}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label={tx('ملاحظات الجلسة والروتين المنزلي الموصى به:', 'Session Notes & Home Care Regimen:')}
          >
            <Input.TextArea
              rows={3}
              placeholder={tx(
                'مثال: تم تفريغ الرؤوس السوداء، وضع ماسك الذهب لمدة 20 دقيقة مع قناع الضوء الأحمر، التوصية بغسول رغوي وواقي شمس...',
                'e.g. Cleared blackheads, applied gold mask with red LED mask, prescribed foaming cleanser and SPF 50...'
              )}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- MODAL 1: ADD PRICED FACE MASK (PRICE STRICTLY REQUIRED) --- */}
      <Modal
        title={
          <Space>
            <Sparkles size={18} color="#db2777" />
            <span style={{ fontWeight: 700 }}>
              {tx('إضافة ماسك وجه جديد مسعر (إلزامي السعر)', 'Add New Priced Face Mask')}
            </span>
          </Space>
        }
        open={isAddMaskModalOpen}
        onOk={() => maskForm.submit()}
        onCancel={() => setIsAddMaskModalOpen(false)}
        okText={tx('حفظ وإضافة للكتالوج', 'Save & Add Mask')}
        cancelText={tx('إلغاء', 'Cancel')}
      >
        <Form form={maskForm} layout="vertical" onFinish={handleCreateMask} style={{ marginTop: 12 }}>
          <Alert
            type="warning"
            showIcon
            message={tx(
              '⚠️ سياسة العيادة: لا يمكن إضافة أي ماسك للوجه دون تحديد سعره الرسمي بالجنيه!',
              'Clinic Policy: Every mask MUST have an approved price in EGP.'
            )}
            style={{ marginBottom: 14, fontSize: 12 }}
          />

          <Form.Item
            name="name"
            label={tx('اسم ماسك الوجه الجديد:', 'Face Mask Name:')}
            rules={[{ required: true, message: tx('برجاء إدخال اسم الماسك', 'Mask name required') }]}
          >
            <Input placeholder={tx('مثال: ماسك الكافيار والريتينول المركز', 'e.g. Caviar & Retinol Mask')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="price"
                label={tx('سعر الماسك المعتمد بالجنيه (EGP)*:', 'Approved Price in EGP*:')}
                rules={[
                  { required: true, message: tx('ممنوع إضافة ماسك بدون سعر!', 'Price is required!') },
                  {
                    validator: async (_, val) => {
                      if (!val || Number(val) <= 0) {
                        return Promise.reject(new Error(tx('يجب أن يكون السعر أكبر من صفر!', 'Price must be > 0')));
                      }
                    },
                  },
                ]}
              >
                <InputNumber
                  min={10}
                  step={50}
                  style={{ width: '100%' }}
                  addonAfter="ج.م"
                  placeholder="350"
                />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item
                name="durationMin"
                label={tx('المدة (دقيقة):', 'Duration (min):')}
                initialValue={20}
              >
                <InputNumber min={5} max={60} step={5} style={{ width: '100%' }} addonAfter="دقيقة" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={tx('الوصف الإكلينيكي أو المكونات:', 'Clinical Description:')}>
            <Input placeholder={tx('مثال: مضاد شيخوخة ومرمم لخلايا البشرة الباهتة', 'e.g. Anti-aging cell restorative')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- MODAL 2: ADD PRICED FACIAL DEVICE (PRICE STRICTLY REQUIRED) --- */}
      <Modal
        title={
          <Space>
            <Cpu size={18} color="#0d9488" />
            <span style={{ fontWeight: 700 }}>
              {tx('إضافة جهاز وجه مسعر جديد (إلزامي السعر)', 'Add New Priced Facial Device')}
            </span>
          </Space>
        }
        open={isAddDeviceModalOpen}
        onOk={() => deviceForm.submit()}
        onCancel={() => setIsAddDeviceModalOpen(false)}
        okText={tx('حفظ وإضافة الجهاز', 'Save & Add Device')}
        cancelText={tx('إلغاء', 'Cancel')}
      >
        <Form form={deviceForm} layout="vertical" onFinish={handleCreateDevice} style={{ marginTop: 12 }}>
          <Alert
            type="warning"
            showIcon
            message={tx(
              '⚠️ سياسة العيادة: يُمنع إضافة أي جهاز أو محطة عمل بدون تحديد سعر الجلسة بالجنيه!',
              'Clinic Policy: Every facial device MUST have an approved session fee in EGP.'
            )}
            style={{ marginBottom: 14, fontSize: 12 }}
          />

          <Form.Item
            name="name"
            label={tx('اسم جهاز الوجه / الخدمة:', 'Facial Device / Procedure Name:')}
            rules={[{ required: true, message: tx('برجاء إدخال اسم الجهاز', 'Device name required') }]}
          >
            <Input placeholder={tx('مثال: جهاز الهايفو 7D لشد الوجه والرقبة', 'e.g. HIFU 7D Facial Contouring')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="price"
                label={tx('سعر الجلسة بالجهاز (EGP)*:', 'Session Price in EGP*:')}
                rules={[
                  { required: true, message: tx('ممنوع إضافة جهاز بدون تسعير!', 'Price is required!') },
                  {
                    validator: async (_, val) => {
                      if (!val || Number(val) <= 0) {
                        return Promise.reject(new Error(tx('يجب أن يكون السعر أكبر من صفر!', 'Price must be > 0')));
                      }
                    },
                  },
                ]}
              >
                <InputNumber
                  min={50}
                  step={50}
                  style={{ width: '100%' }}
                  addonAfter="ج.م"
                  placeholder="850"
                />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item
                name="durationMin"
                label={tx('مدة الجلسة (دقيقة):', 'Duration (min):')}
                initialValue={30}
              >
                <InputNumber min={5} max={120} step={5} style={{ width: '100%' }} addonAfter="دقيقة" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={tx('الوصف والتقنية المستخدمة:', 'Description & Technology:')}>
            <Input placeholder={tx('مثال: موجات فوق صوتية مركزة لشد العضلات والطبقات العميقة', 'e.g. High intensity focused ultrasound')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
