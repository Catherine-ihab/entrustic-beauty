// Unified Aesthetic Clinic Doctor & Staff Commission & Earnings Engine (نظام احتساب مستحقات وعمولات الأطباء وطاقم التمريض)
// Connects treatment session execution directly with doctor financial settlements
// Idempotent: Never credits commissions twice for the same procedure session

export interface DoctorCommissionRule {
  doctorId: string;
  doctorName: string;
  specialty: string;
  roleType?: 'doctor' | 'specialist' | 'nurse_tech';
  rateType: 'percentage' | 'fixed_per_session';
  percentageRate?: number; // e.g. 20 for 20%
  fixedRateEgp?: number;   // e.g. 200 EGP per session
  productCommissionRate?: number; // e.g. 10% on skincare product sales
  categoryOverrides?: Record<string, number>; // e.g. { 'بوتوكس وفيلر': 25, 'ليزر وإزالة شعر': 15 }
}

export interface DoctorEarningEntry {
  id: string;
  sessionRefId: string; // Unique ID of the clinical session (prevents double counting)
  doctorId: string;
  doctorName: string;
  roleType?: 'doctor' | 'specialist' | 'nurse_tech';
  itemType?: 'session' | 'product_sale' | 'bonus';
  patientId?: string;
  patientName: string;
  serviceName: string;
  serviceCategory: string;
  servicePriceEgp: number;
  commissionRate: number; // percentage or fixed
  rateType: 'percentage' | 'fixed_per_session';
  earnedAmountEgp: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'accrued' | 'settled' | 'cancelled';
  payoutId?: string;
  notes?: string;
}

export interface DoctorPayout {
  id: string;
  voucherNumber: string;
  doctorId: string;
  doctorName: string;
  amountEgp: number;
  date: string; // YYYY-MM-DD HH:mm
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
  referenceNo?: string;
  settledEarningIds: string[];
  notes?: string;
}

const LS_RULES_KEY = 'clinic_doctor_commission_rules_v1';
const LS_EARNINGS_KEY = 'clinic_doctor_earnings_v1';
const LS_PAYOUTS_KEY = 'clinic_doctor_payouts_v1';

export const DEFAULT_DOCTOR_RULES: DoctorCommissionRule[] = [
  {
    doctorId: 'doc-1',
    doctorName: 'د. سارة القاضي',
    specialty: 'ليزر وإزالة شعر وتجميل',
    roleType: 'doctor',
    rateType: 'percentage',
    percentageRate: 20, // 20% commission on laser & aesthetic sessions
    productCommissionRate: 10,
    categoryOverrides: {
      'ليزر وإزالة شعر': 20,
      'بوتوكس وفيلر': 25,
      'عناية بالبشرة وهيدرافيشل': 15,
    },
  },
  {
    doctorId: 'doc-2',
    doctorName: 'د. هبة رمضان',
    specialty: 'جراحة التجميل وحقن الفيلر والبوتوكس',
    roleType: 'doctor',
    rateType: 'percentage',
    percentageRate: 30, // 30% commission on aesthetic injectables
    productCommissionRate: 10,
    categoryOverrides: {
      'بوتوكس وفيلر': 30,
      'خيوط تجميلية': 35,
    },
  },
  {
    doctorId: 'doc-3',
    doctorName: 'أخصائية البشرة ندى',
    specialty: 'عناية بالبشرة وهيدرافيشل',
    roleType: 'specialist',
    rateType: 'percentage',
    percentageRate: 15, // 15% per facial care session
    productCommissionRate: 12,
  },
  {
    doctorId: 'doc-4',
    doctorName: 'أخصائية السبا فاطمة',
    specialty: 'سبا ومساج وحمام مغربي',
    roleType: 'specialist',
    rateType: 'fixed_per_session',
    fixedRateEgp: 150, // 150 EGP per royal hammam session
  },
  {
    doctorId: 'doc-5',
    doctorName: 'أخصائية الجسم مريم',
    specialty: 'عناية بالجسم وسكراب',
    roleType: 'specialist',
    rateType: 'fixed_per_session',
    fixedRateEgp: 120, // 120 EGP per body care session
  },
  {
    doctorId: 'doc-6',
    doctorName: 'الممرضة آية أحمد',
    specialty: 'تمريض ودعم جلسات الليزر والتحضير',
    roleType: 'nurse_tech',
    rateType: 'fixed_per_session',
    fixedRateEgp: 50,
  },
];

const INITIAL_DEMO_EARNINGS: DoctorEarningEntry[] = [
  {
    id: 'ern-demo-1',
    sessionRefId: 'ses-101',
    doctorId: 'doc-2',
    doctorName: 'د. هبة رمضان',
    roleType: 'doctor',
    itemType: 'session',
    patientId: 'PAT-00104',
    patientName: 'لينا الحسن',
    serviceName: 'حقن فيلر الشفاه Restylane Kysse',
    serviceCategory: 'بوتوكس وفيلر',
    servicePriceEgp: 2500,
    commissionRate: 30,
    rateType: 'percentage',
    earnedAmountEgp: 750,
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: '14:30',
    status: 'accrued',
    notes: 'جلسة حقن 1 مل متناسق',
  },
  {
    id: 'ern-demo-2',
    sessionRefId: 'ses-102',
    doctorId: 'doc-1',
    doctorName: 'د. سارة القاضي',
    roleType: 'doctor',
    itemType: 'session',
    patientId: 'PAT-00140',
    patientName: 'سارة فهمي',
    serviceName: 'ليزر كانديلا جنتل ماكس برو ساقين كاملة',
    serviceCategory: 'ليزر وإزالة شعر',
    servicePriceEgp: 850,
    commissionRate: 20,
    rateType: 'percentage',
    earnedAmountEgp: 170,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '12:00',
    status: 'accrued',
    notes: 'الجلسة الرابعة بالكورس',
  },
  {
    id: 'ern-demo-3',
    sessionRefId: 'ses-103',
    doctorId: 'doc-3',
    doctorName: 'أخصائية البشرة ندى',
    roleType: 'specialist',
    itemType: 'session',
    patientId: 'PAT-00120',
    patientName: 'مريم الصاوي',
    serviceName: 'جلسة تنظيف مائي هيدرافيشل وماسك الذهب',
    serviceCategory: 'عناية بالبشرة وهيدرافيشل',
    servicePriceEgp: 1200,
    commissionRate: 15,
    rateType: 'percentage',
    earnedAmountEgp: 180,
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    status: 'accrued',
    notes: 'تنظيف مسام وماسك كولاجين',
  },
  {
    id: 'ern-demo-4',
    sessionRefId: 'ses-104',
    doctorId: 'doc-4',
    doctorName: 'أخصائية السبا فاطمة',
    roleType: 'specialist',
    itemType: 'session',
    patientId: 'PAT-00095',
    patientName: 'نوران الشاذلي',
    serviceName: 'حمام مغربي ملكي بالأعشاب الطبيعية',
    serviceCategory: 'سبا ومساج وحمام مغربي',
    servicePriceEgp: 950,
    commissionRate: 150,
    rateType: 'fixed_per_session',
    earnedAmountEgp: 150,
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    time: '16:00',
    status: 'settled',
    notes: 'تم صرف المستحقات في تسوية الأسبوع',
  },
  {
    id: 'ern-demo-5',
    sessionRefId: 'ses-105',
    doctorId: 'doc-1',
    doctorName: 'د. سارة القاضي',
    roleType: 'doctor',
    itemType: 'session',
    patientId: 'PAT-00088',
    patientName: 'دينا مصطفى',
    serviceName: 'حقن بوتوكس الجبهة والجلابيلا',
    serviceCategory: 'بوتوكس وفيلر',
    servicePriceEgp: 1600,
    commissionRate: 25,
    rateType: 'percentage',
    earnedAmountEgp: 400,
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    time: '15:20',
    status: 'settled',
    notes: 'تمت التسوية',
  },
  {
    id: 'ern-demo-6',
    sessionRefId: 'ses-106',
    doctorId: 'doc-6',
    doctorName: 'الممرضة آية أحمد',
    roleType: 'nurse_tech',
    itemType: 'session',
    patientId: 'PAT-00140',
    patientName: 'سارة فهمي',
    serviceName: 'مساعدة وتحضير جلسة ليزر كانديلا',
    serviceCategory: 'ليزر وإزالة شعر',
    servicePriceEgp: 850,
    commissionRate: 50,
    rateType: 'fixed_per_session',
    earnedAmountEgp: 50,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '12:00',
    status: 'accrued',
    notes: 'مساعدة تمريضية',
  },
  {
    id: 'ern-demo-7',
    sessionRefId: 'ses-107',
    doctorId: 'doc-3',
    doctorName: 'أخصائية البشرة ندى',
    roleType: 'specialist',
    itemType: 'product_sale',
    patientId: 'PAT-00120',
    patientName: 'مريم الصاوي',
    serviceName: 'سيروم هيالورونيك وترطيب La Roche-Posay B5',
    serviceCategory: 'مبيعات منتجات العناية بالبشرة',
    servicePriceEgp: 950,
    commissionRate: 12,
    rateType: 'percentage',
    earnedAmountEgp: 114,
    date: new Date().toISOString().split('T')[0],
    time: '12:05',
    status: 'accrued',
    notes: 'عمولة مبيعات منتجات عناية منزلية',
  },
];

// --- Commission Rules Management ---
export function getDoctorCommissionRules(): DoctorCommissionRule[] {
  try {
    const raw = localStorage.getItem(LS_RULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem(LS_RULES_KEY, JSON.stringify(DEFAULT_DOCTOR_RULES));
  return DEFAULT_DOCTOR_RULES;
}

export function saveDoctorCommissionRules(rules: DoctorCommissionRule[]): void {
  try {
    localStorage.setItem(LS_RULES_KEY, JSON.stringify(rules));
  } catch (_) {}
}

// --- Earnings Ledger Management ---
export function getDoctorEarnings(): DoctorEarningEntry[] {
  try {
    const raw = localStorage.getItem(LS_EARNINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem(LS_EARNINGS_KEY, JSON.stringify(INITIAL_DEMO_EARNINGS));
  return INITIAL_DEMO_EARNINGS;
}

export function saveDoctorEarnings(entries: DoctorEarningEntry[]): void {
  try {
    localStorage.setItem(LS_EARNINGS_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event('doctor_earnings_updated'));
  } catch (_) {}
}

// Record a doctor earning on actual session execution (IDEMPOTENT)
export function recordDoctorSessionEarning(params: {
  sessionRefId: string;
  doctorName: string;
  roleType?: 'doctor' | 'specialist' | 'nurse_tech';
  patientId?: string;
  patientName: string;
  serviceName: string;
  serviceCategory: string;
  servicePriceEgp: number;
  date?: string;
  time?: string;
  notes?: string;
}): DoctorEarningEntry | null {
  const current = getDoctorEarnings();

  // 1. Idempotency Check: if this session was already logged, DO NOT duplicate!
  const existing = current.find((e) => e.sessionRefId === params.sessionRefId);
  if (existing) {
    return existing;
  }

  // 2. Resolve Doctor Commission Rule
  const rules = getDoctorCommissionRules();
  const rule = rules.find((r) =>
    r.doctorName.toLowerCase().includes(params.doctorName.toLowerCase()) ||
    params.doctorName.toLowerCase().includes(r.doctorName.toLowerCase())
  );

  let earnedAmountEgp = 0;
  let rateType: 'percentage' | 'fixed_per_session' = 'percentage';
  let commissionRate = 20;

  if (rule) {
    rateType = rule.rateType;
    if (rule.rateType === 'fixed_per_session') {
      commissionRate = rule.fixedRateEgp || 150;
      earnedAmountEgp = commissionRate;
    } else {
      // Check for category override
      if (rule.categoryOverrides && rule.categoryOverrides[params.serviceCategory]) {
        commissionRate = rule.categoryOverrides[params.serviceCategory];
      } else {
        commissionRate = rule.percentageRate || 20;
      }
      earnedAmountEgp = Math.round((params.servicePriceEgp * commissionRate) / 100);
    }
  } else {
    // Default fallback: 20%
    earnedAmountEgp = Math.round((params.servicePriceEgp * 20) / 100);
  }

  const now = new Date();
  const dateStr = params.date || now.toISOString().split('T')[0];
  const timeStr = params.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const entry: DoctorEarningEntry = {
    id: `ern-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    sessionRefId: params.sessionRefId,
    doctorId: rule?.doctorId || `doc-gen-${Date.now()}`,
    doctorName: params.doctorName,
    roleType: rule?.roleType || params.roleType || 'doctor',
    itemType: 'session',
    patientId: params.patientId,
    patientName: params.patientName,
    serviceName: params.serviceName,
    serviceCategory: params.serviceCategory,
    servicePriceEgp: params.servicePriceEgp,
    commissionRate,
    rateType,
    earnedAmountEgp,
    date: dateStr,
    time: timeStr,
    status: 'accrued',
    notes: params.notes,
  };

  saveDoctorEarnings([entry, ...current]);
  return entry;
}

// Add manual commission / product commission / bonus
export function addManualDoctorEarning(params: {
  doctorName: string;
  roleType?: 'doctor' | 'specialist' | 'nurse_tech';
  itemType: 'session' | 'product_sale' | 'bonus';
  patientName?: string;
  serviceOrProductName: string;
  serviceCategory?: string;
  baseAmountEgp: number;
  commissionAmountEgp: number;
  notes?: string;
}): DoctorEarningEntry {
  const current = getDoctorEarnings();
  const rules = getDoctorCommissionRules();
  const rule = rules.find((r) => r.doctorName === params.doctorName);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const entry: DoctorEarningEntry = {
    id: `ern-man-${Date.now()}`,
    sessionRefId: `manual-${Date.now()}`,
    doctorId: rule?.doctorId || `doc-${Date.now()}`,
    doctorName: params.doctorName,
    roleType: rule?.roleType || params.roleType || 'doctor',
    itemType: params.itemType,
    patientName: params.patientName || 'مبيعات مباشرة',
    serviceName: params.serviceOrProductName,
    serviceCategory: params.serviceCategory || (params.itemType === 'product_sale' ? 'مبيعات منتجات العناية بالبشرة' : 'مكافأة / حافز إداري'),
    servicePriceEgp: params.baseAmountEgp,
    commissionRate: params.baseAmountEgp > 0 ? Math.round((params.commissionAmountEgp / params.baseAmountEgp) * 100) : 0,
    rateType: 'fixed_per_session',
    earnedAmountEgp: params.commissionAmountEgp,
    date: dateStr,
    time: timeStr,
    status: 'accrued',
    notes: params.notes,
  };

  saveDoctorEarnings([entry, ...current]);
  return entry;
}

// --- Payouts Management ---
export function getDoctorPayouts(): DoctorPayout[] {
  try {
    const raw = localStorage.getItem(LS_PAYOUTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveDoctorPayouts(payouts: DoctorPayout[]): void {
  try {
    localStorage.setItem(LS_PAYOUTS_KEY, JSON.stringify(payouts));
    window.dispatchEvent(new Event('doctor_earnings_updated'));
  } catch (_) {}
}

// Record a settlement payout to doctor with voucher number
export function payoutDoctorSettlement(params: {
  doctorId: string;
  doctorName: string;
  amountEgp: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
  referenceNo?: string;
  notes?: string;
}): DoctorPayout {
  const earnings = getDoctorEarnings();
  const payouts = getDoctorPayouts();

  // Mark unpaid accrued earnings as settled up to payout amount
  let remainingAmount = params.amountEgp;
  const settledIds: string[] = [];

  const updatedEarnings = earnings.map((e) => {
    if (e.doctorName === params.doctorName && e.status === 'accrued' && remainingAmount > 0) {
      settledIds.push(e.id);
      remainingAmount -= e.earnedAmountEgp;
      return { ...e, status: 'settled' as const };
    }
    return e;
  });

  saveDoctorEarnings(updatedEarnings);

  const voucherNumber = `VOUCH-${new Date().getFullYear()}-${String(payouts.length + 1).padStart(4, '0')}`;

  const newPayout: DoctorPayout = {
    id: `payo-${Date.now()}`,
    voucherNumber,
    doctorId: params.doctorId,
    doctorName: params.doctorName,
    amountEgp: params.amountEgp,
    date: new Date().toISOString(),
    paymentMethod: params.paymentMethod,
    referenceNo: params.referenceNo || voucherNumber,
    settledEarningIds: settledIds,
    notes: params.notes,
  };

  saveDoctorPayouts([newPayout, ...payouts]);
  return newPayout;
}
