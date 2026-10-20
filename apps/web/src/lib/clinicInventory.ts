// Unified Aesthetic Clinic Inventory & Consumables Store (دليل المستلزمات والمخزن الطبي التجميلي)
// Connects inventory with Injectables, Skincare, Laser, Body Care, Spa, and Post-Care Treatments

export type InventoryCategory =
  | 'حقن وبوتوكس وفيلر'
  | 'عناية بالبشرة وماسكات'
  | 'مراهم وكريمات ما بعد الجلسات'
  | 'ليزر وتبريد'
  | 'عناية بالجسم وسكراب'
  | 'سبا ومساج وحمام'
  | 'مستهلكات طبية وإبر';

export interface ClinicInventoryItem {
  id: string;
  name: string;
  nameEn: string;
  sku: string;
  category: InventoryCategory;
  currentStock: number;
  unit: string; // e.g. فايل، سرنجة، علبة، أنبوبة، ماسك، لتر
  reorderLevel: number;
  batchLotNumber: string;
  expiryDate: string; // YYYY-MM-DD
  unitCostEgp: number;
  clinicPriceEgp?: number; // Optional resale/charged price
  notes?: string;
  lastUpdated?: string;
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'حقن وبوتوكس وفيلر',
  'عناية بالبشرة وماسكات',
  'مراهم وكريمات ما بعد الجلسات',
  'ليزر وتبريد',
  'عناية بالجسم وسكراب',
  'سبا ومساج وحمام',
  'مستهلكات طبية وإبر',
];

const LS_INVENTORY_KEY = 'clinic_inventory_items_v2';

export const INITIAL_CLINIC_INVENTORY: ClinicInventoryItem[] = [
  // 1. حقن وبوتوكس وفيلر
  {
    id: 'inv-btx-all',
    name: 'فايل بوتوكس Allergan Botox Cosmetic',
    nameEn: 'Allergan Botox 100U Vial',
    sku: 'BTX-ALL-100',
    category: 'حقن وبوتوكس وفيلر',
    currentStock: 18,
    unit: 'فايل 100U',
    reorderLevel: 5,
    batchLotNumber: 'C38491-02',
    expiryDate: '2027-08-30',
    unitCostEgp: 2800,
    clinicPriceEgp: 4500,
    notes: 'يحفظ مبرداً من 2 إلى 8 درجات مئوية. إعادة التخفيف بـ 2.5ml محلول ملحي.',
  },
  {
    id: 'inv-btx-dys',
    name: 'فايل توكسين ديسبورت Dysport Galderma',
    nameEn: 'Dysport 300U Vial',
    sku: 'BTX-DYS-300',
    category: 'حقن وبوتوكس وفيلر',
    currentStock: 12,
    unit: 'فايل 300U',
    reorderLevel: 4,
    batchLotNumber: 'DYS-89012',
    expiryDate: '2027-05-15',
    unitCostEgp: 2600,
    clinicPriceEgp: 4200,
    notes: 'توكسين سريع الانتشار مناسب للجبهة والتعرق المفرط.',
  },
  {
    id: 'inv-fil-juv',
    name: 'سرنجة فيلر Juvederm Ultra 4 بالليدوكائين',
    nameEn: 'Juvederm Ultra 4 (1.0 mL)',
    sku: 'FIL-JUV-04',
    category: 'حقن وبوتوكس وفيلر',
    currentStock: 14,
    unit: 'سرنجة 1.0 mL',
    reorderLevel: 5,
    batchLotNumber: 'JV4-88301',
    expiryDate: '2027-03-15',
    unitCostEgp: 3200,
    clinicPriceEgp: 5500,
    notes: 'حمض هيالورونيك عالي الكثافة لخطوط الابتسامة وحجم الشفاه والوجنات.',
  },
  {
    id: 'inv-fil-kys',
    name: 'سرنجة فيلر Restylane Kysse للشفاه',
    nameEn: 'Restylane Kysse Lip Filler (1.0 mL)',
    sku: 'FIL-RES-KYS',
    category: 'حقن وبوتوكس وفيلر',
    currentStock: 8,
    unit: 'سرنجة 1.0 mL',
    reorderLevel: 3,
    batchLotNumber: 'KYS-77210',
    expiryDate: '2026-11-20',
    unitCostEgp: 3100,
    clinicPriceEgp: 5200,
    notes: 'تقنية OBT المرنة لشفاه طبيعية وحركة ناعمة بدون تكتل.',
  },
  {
    id: 'inv-fil-pro',
    name: 'إبرة نضارة بروفايلو Profhilo HA المركزة',
    nameEn: 'Profhilo HA (2.0 mL Syringe)',
    sku: 'SKN-PRO-02',
    category: 'حقن وبوتوكس وفيلر',
    currentStock: 9,
    unit: 'سرنجة 2.0 mL',
    reorderLevel: 4,
    batchLotNumber: 'PRF-55109',
    expiryDate: '2027-01-10',
    unitCostEgp: 3400,
    clinicPriceEgp: 6000,
    notes: 'حمض هيالورونيك حر ومترابط للوجه والرقبة بتقنية نقاط BAP.',
  },
  {
    id: 'inv-bio-rad',
    name: 'سرنجة محفز كولاجين راديس Radiesse CaHA',
    nameEn: 'Radiesse 1.5 mL Syringe',
    sku: 'BIO-RAD-15',
    category: 'حقن وبوتوكس وفيلر',
    currentStock: 6,
    unit: 'سرنجة 1.5 mL',
    reorderLevel: 3,
    batchLotNumber: 'RAD-99120',
    expiryDate: '2027-09-01',
    unitCostEgp: 4200,
    clinicPriceEgp: 7000,
    notes: 'كالسيوم هيدروكسيل أباتيت لشد الفك والرقبة واليدين وتوليد كولاجين ذاتي.',
  },

  // 2. عناية بالبشرة وماسكات
  {
    id: 'inv-msk-gold',
    name: 'ماسك الذهب عيار 24K الفاخر للشد والتوهج',
    nameEn: '24K Luxury Pure Gold Facial Sheet Mask',
    sku: 'MSK-GLD-24',
    category: 'عناية بالبشرة وماسكات',
    currentStock: 45,
    unit: 'ماسك فردي معقم',
    reorderLevel: 15,
    batchLotNumber: 'GLD-2026-03',
    expiryDate: '2028-02-28',
    unitCostEgp: 120,
    clinicPriceEgp: 400,
    notes: 'ماسك ورقي برقائق الذهب لتحفيز نضارة الوجه بعد جلسات الهيدرافيشل والتقشير.',
  },
  {
    id: 'inv-msk-col',
    name: 'ماسك الكولاجين البحري المركز المرطب',
    nameEn: 'Marine Collagen Hydro-Wrap Mask',
    sku: 'MSK-COL-01',
    category: 'عناية بالبشرة وماسكات',
    currentStock: 35,
    unit: 'ماسك فردي',
    reorderLevel: 10,
    batchLotNumber: 'COL-88219',
    expiryDate: '2027-10-15',
    unitCostEgp: 90,
    clinicPriceEgp: 300,
    notes: 'ترطيب عميق ومرونة فورية لأنسجة البشرة المجهدة.',
  },
  {
    id: 'inv-msk-ha',
    name: 'ماسك الهيدروجيل بالهيالورونيك المركز',
    nameEn: 'HA Deep Plumping Hydrogel Mask',
    sku: 'MSK-HYD-02',
    category: 'عناية بالبشرة وماسكات',
    currentStock: 30,
    unit: 'ماسك جل',
    reorderLevel: 10,
    batchLotNumber: 'HYD-33104',
    expiryDate: '2027-07-20',
    unitCostEgp: 80,
    clinicPriceEgp: 250,
    notes: 'يهدئ الاحمرار فورياً بعد الديرمابن والتقشير الكيميائي.',
  },
  {
    id: 'inv-skn-ser',
    name: 'محلول تنظيف وتغذية الهيدرافيشل Syndeo Boosters',
    nameEn: 'HydraFacial Cleansing & Infusion Serum (500ml)',
    sku: 'SER-HYD-500',
    category: 'عناية بالبشرة وماسكات',
    currentStock: 12,
    unit: 'عبوة 500 mL',
    reorderLevel: 3,
    batchLotNumber: 'SYN-66120',
    expiryDate: '2027-06-30',
    unitCostEgp: 950,
    clinicPriceEgp: 1800,
    notes: 'محلول مخصص لأجهزة التنظيف المائي بالشفط.',
  },

  // 3. مراهم وكريمات ما بعد الجلسات
  {
    id: 'inv-crm-fuc',
    name: 'كريم فيوسيكورت Fucicort مهدئ ومضاد حيوي',
    nameEn: 'Fucicort Cream (30g Tube)',
    sku: 'CRM-FUC-30',
    category: 'مراهم وكريمات ما بعد الجلسات',
    currentStock: 25,
    unit: 'أنبوبة 30g',
    reorderLevel: 8,
    batchLotNumber: 'FUC-44102',
    expiryDate: '2027-12-01',
    unitCostEgp: 65,
    clinicPriceEgp: 120,
    notes: 'يوضع مباشرة بعد جلسات الليزر وإزالة الشعر لمنع الالتهاب البكتيري والاحمرار.',
  },
  {
    id: 'inv-crm-pan',
    name: 'كريم بانثينول Panthenol للترطيب وتجديد الجلد',
    nameEn: 'Panthenol 5% Soothing Cream (50g)',
    sku: 'CRM-PAN-50',
    category: 'مراهم وكريمات ما بعد الجلسات',
    currentStock: 40,
    unit: 'أنبوبة 50g',
    reorderLevel: 12,
    batchLotNumber: 'PAN-2026-A',
    expiryDate: '2028-04-30',
    unitCostEgp: 35,
    clinicPriceEgp: 80,
    notes: 'كريم ترطيب أساسي يوصى به بعد كل جلسات التقشير والليزر.',
  },
  {
    id: 'inv-crm-meb',
    name: 'مرهم ميبو MEBO العشبي المرمم للجلد',
    nameEn: 'MEBO Regenerating Burn & Post-Laser Ointment',
    sku: 'ONT-MEB-30',
    category: 'مراهم وكريمات ما بعد الجلسات',
    currentStock: 20,
    unit: 'أنبوبة 30g',
    reorderLevel: 6,
    batchLotNumber: 'MEB-77123',
    expiryDate: '2028-01-15',
    unitCostEgp: 95,
    clinicPriceEgp: 160,
    notes: 'علاج فعال للحروق السطحية والتقشير الحراري وتجديد الأنسجة.',
  },
  {
    id: 'inv-crm-sun',
    name: 'واقي شمس طبي حماية قصوى La Roche Anthelios SPF50+',
    nameEn: 'Medical Sunscreen Fluid SPF 50+ (50ml)',
    sku: 'SUN-LAR-50',
    category: 'مراهم وكريمات ما بعد الجلسات',
    currentStock: 18,
    unit: 'عبوة 50 mL',
    reorderLevel: 5,
    batchLotNumber: 'LAR-99410',
    expiryDate: '2027-08-15',
    unitCostEgp: 420,
    clinicPriceEgp: 650,
    notes: 'موصى به لحماية جميع الحالات بعد جلسات الليزر وحقن الوجه والتقشير.',
  },

  // 4. ليزر وتبريد
  {
    id: 'inv-lzr-gel',
    name: 'جل تبريد ليزر شفاف طبي عالي التوصيل',
    nameEn: 'Medical Ultrasonic Laser Cooling Gel (5 Liters)',
    sku: 'GEL-LZR-5L',
    category: 'ليزر وتبريد',
    currentStock: 8,
    unit: 'جركن 5 لتر',
    reorderLevel: 2,
    batchLotNumber: 'GEL-2026-05',
    expiryDate: '2028-05-30',
    unitCostEgp: 300,
    clinicPriceEgp: 500,
    notes: 'يوفر حماية حرارية للجلد وتوصيلاً ضوئياً متفوقاً لأجهزة الليزر.',
  },
  {
    id: 'inv-lzr-dcd',
    name: 'أسطوانات غاز التبريد النيتروجيني كانديلا DCD',
    nameEn: 'Candela DCD Cryogen Canisters (Pack of 12)',
    sku: 'CRY-CND-12',
    category: 'ليزر وتبريد',
    currentStock: 15,
    unit: 'عبوة كانستر',
    reorderLevel: 4,
    batchLotNumber: 'CND-88219',
    expiryDate: '2029-01-01',
    unitCostEgp: 650,
    clinicPriceEgp: 1100,
    notes: 'تبريد ديناميكي متزامن مع كل نبضة ليزر GentleMax Pro.',
  },

  // 5. عناية بالجسم وسكراب
  {
    id: 'inv-bdy-cof',
    name: 'سكراب القهوة العضوية وزبدة الشيا الخام لتفتيح الجسم',
    nameEn: 'Organic Coffee & Shea Butter Body Scrub (1kg)',
    sku: 'SCR-COF-1K',
    category: 'عناية بالجسم وسكراب',
    currentStock: 14,
    unit: 'عبوة 1 كجم',
    reorderLevel: 4,
    batchLotNumber: 'COF-1104',
    expiryDate: '2027-06-15',
    unitCostEgp: 250,
    clinicPriceEgp: 550,
    notes: 'تقشير وتنشيط الدورة الدموية ومقاومة السيلوليت وتوحيد لون البشرة.',
  },
  {
    id: 'inv-bdy-mlk',
    name: 'سنفرة ملح الحليب واللافندر للجسم والأماكن الحساسة',
    nameEn: 'Aromatic Milk Salt & Lavender Polish (800g)',
    sku: 'SLT-MLK-80',
    category: 'عناية بالجسم وسكراب',
    currentStock: 16,
    unit: 'برطمان 800g',
    reorderLevel: 5,
    batchLotNumber: 'MLK-5521',
    expiryDate: '2027-09-30',
    unitCostEgp: 200,
    clinicPriceEgp: 450,
    notes: 'تنعيم فوري للمناطق الخشنة كالركب والأكواع وإزالة الجلد الميت.',
  },

  // 6. سبا ومساج وحمام
  {
    id: 'inv-spa-mor',
    name: 'صابون بلدي مغربي بزيت الزيتون والأعشاب',
    nameEn: 'Authentic Moroccan Black Soap (1kg)',
    sku: 'SOP-MOR-1K',
    category: 'سبا ومساج وحمام',
    currentStock: 20,
    unit: 'عبوة 1 كجم',
    reorderLevel: 5,
    batchLotNumber: 'MOR-4431',
    expiryDate: '2028-03-01',
    unitCostEgp: 180,
    clinicPriceEgp: 450,
    notes: 'صابون أسود طبيعي أصلي للحمام المغربي الملكي.',
  },
  {
    id: 'inv-spa-oil',
    name: 'زيوت مساج عضوية مهدئة (لافندر ولوز نقي)',
    nameEn: 'Pure Lavender & Sweet Almond Relaxing Body Oil (1L)',
    sku: 'OIL-SPA-1L',
    category: 'سبا ومساج وحمام',
    currentStock: 10,
    unit: 'زجاجة 1 لتر',
    reorderLevel: 3,
    batchLotNumber: 'OIL-7719',
    expiryDate: '2027-11-15',
    unitCostEgp: 320,
    clinicPriceEgp: 700,
    notes: 'مساج استرخائي وتغذية للجلد.',
  },

  // 7. مستهلكات طبية وإبر
  {
    id: 'inv-med-nan',
    name: 'إبر نانو دقيقة جداً لحقن البوتوكس 32G 4mm Nano-needle',
    nameEn: '32G 4mm Nano-needles (Box of 100)',
    sku: 'NDL-NAN-32',
    category: 'مستهلكات طبية وإبر',
    currentStock: 22,
    unit: 'علبة 100 إبرة',
    reorderLevel: 6,
    batchLotNumber: 'NAN-3204',
    expiryDate: '2029-08-30',
    unitCostEgp: 450,
    clinicPriceEgp: 750,
    notes: 'حقن خالي من الألم بدون كدمات.',
  },
  {
    id: 'inv-med-can',
    name: 'كانيولا أمان فيلر تجميلية 25G 50mm TSK Cannula',
    nameEn: '25G 50mm Blunt Tip Safety Cannula (Box of 20)',
    sku: 'CAN-TSK-25',
    category: 'مستهلكات طبية وإبر',
    currentStock: 18,
    unit: 'علبة 20 كانيولا',
    reorderLevel: 5,
    batchLotNumber: 'CAN-2550',
    expiryDate: '2029-04-15',
    unitCostEgp: 650,
    clinicPriceEgp: 1100,
    notes: 'رأس غير حاد لمنع تمزق الأوعية الدموية في الشفاه والوجنات.',
  },
];

export function getClinicInventory(): ClinicInventoryItem[] {
  try {
    const raw = localStorage.getItem(LS_INVENTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  // Initialize with complete aesthetic catalog
  localStorage.setItem(LS_INVENTORY_KEY, JSON.stringify(INITIAL_CLINIC_INVENTORY));
  return INITIAL_CLINIC_INVENTORY;
}

export function saveClinicInventory(items: ClinicInventoryItem[]): void {
  try {
    localStorage.setItem(LS_INVENTORY_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('clinic_inventory_updated'));
  } catch (_) {}
}

export function saveInventoryItem(item: ClinicInventoryItem): void {
  const current = getClinicInventory();
  const index = current.findIndex((i) => i.id === item.id);
  let next: ClinicInventoryItem[];
  if (index >= 0) {
    next = [...current];
    next[index] = { ...item, lastUpdated: new Date().toISOString() };
  } else {
    next = [{ ...item, lastUpdated: new Date().toISOString() }, ...current];
  }
  saveClinicInventory(next);
}

export interface InventoryMovement {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  sku: string;
  batchLotNumber: string;
  quantity: number;
  type: 'consumption' | 'receipt' | 'adjustment';
  sessionRefId?: string;
  patientName?: string;
  unitCostEgp: number;
  totalCostEgp: number;
  notes?: string;
}

const LS_MOVEMENTS_KEY = 'clinic_inventory_movements_v1';

export function getInventoryMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(LS_MOVEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveInventoryMovements(movements: InventoryMovement[]): void {
  try {
    localStorage.setItem(LS_MOVEMENTS_KEY, JSON.stringify(movements));
  } catch (_) {}
}

export function deleteInventoryItem(id: string): void {
  const current = getClinicInventory();
  const next = current.filter((i) => i.id !== id);
  saveClinicInventory(next);
}

// Deduct / Consume stock during clinical treatment sessions (IDEMPOTENT via sessionRefId)
export function consumeInventoryStock(
  nameOrIdOrSku: string,
  quantity = 1,
  usedByPatient?: string,
  sessionRefId?: string,
  notes?: string
): { success: boolean; item?: ClinicInventoryItem; message?: string } {
  const current = getClinicInventory();
  const search = nameOrIdOrSku.toLowerCase().trim();
  const item = current.find(
    (i) =>
      i.id === nameOrIdOrSku ||
      i.sku.toLowerCase() === search ||
      i.name.toLowerCase().includes(search) ||
      i.nameEn.toLowerCase().includes(search)
  );

  if (!item) return { success: false, message: 'الصنف غير موجود بالمخزن' };

  // Idempotency: prevent double deduction for the same session
  if (sessionRefId) {
    const movements = getInventoryMovements();
    const alreadyDeducted = movements.some(
      (m) => m.sessionRefId === sessionRefId && m.itemId === item.id && m.type === 'consumption'
    );
    if (alreadyDeducted) {
      return { success: true, item, message: 'تم خصم هذا المستهلك لهذه الجلسة مسبقاً' };
    }
  }

  const newStock = Math.max(0, item.currentStock - quantity);
  const updatedItem: ClinicInventoryItem = {
    ...item,
    currentStock: newStock,
    lastUpdated: new Date().toISOString(),
  };
  saveInventoryItem(updatedItem);

  // Record audit movement log
  const movement: InventoryMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    date: new Date().toISOString(),
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    batchLotNumber: item.batchLotNumber,
    quantity,
    type: 'consumption',
    sessionRefId,
    patientName: usedByPatient,
    unitCostEgp: item.unitCostEgp,
    totalCostEgp: item.unitCostEgp * quantity,
    notes,
  };
  const movements = getInventoryMovements();
  saveInventoryMovements([movement, ...movements]);

  return { success: true, item: updatedItem };
}

// Receive new batch / stock
export function receiveInventoryStock(
  itemId: string,
  quantity: number,
  lotNumber?: string,
  expiryDate?: string
): void {
  const current = getClinicInventory();
  const item = current.find((i) => i.id === itemId);
  if (!item) return;

  const updated: ClinicInventoryItem = {
    ...item,
    currentStock: item.currentStock + quantity,
    batchLotNumber: lotNumber || item.batchLotNumber,
    expiryDate: expiryDate || item.expiryDate,
    lastUpdated: new Date().toISOString(),
  };
  saveInventoryItem(updated);

  // Record movement log
  const movement: InventoryMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    date: new Date().toISOString(),
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    batchLotNumber: lotNumber || item.batchLotNumber,
    quantity,
    type: 'receipt',
    unitCostEgp: item.unitCostEgp,
    totalCostEgp: item.unitCostEgp * quantity,
  };
  const movements = getInventoryMovements();
  saveInventoryMovements([movement, ...movements]);
}

export function subscribeToInventory(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('clinic_inventory_updated', handler);
  window.addEventListener('storage', (e) => {
    if (e.key === LS_INVENTORY_KEY) callback();
  });
  return () => {
    window.removeEventListener('clinic_inventory_updated', handler);
  };
}

