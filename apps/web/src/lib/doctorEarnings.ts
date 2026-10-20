// Unified Aesthetic Clinic Doctor Commission & Earnings Engine (نظام احتساب مستحقات وعمولات الأطباء)
// Connects treatment session execution directly with doctor financial settlements
// Idempotent: Never credits commissions twice for the same procedure session

export interface DoctorCommissionRule {
  doctorId: string;
  doctorName: string;
  specialty: string;
  rateType: 'percentage' | 'fixed_per_session';
  percentageRate?: number; // e.g. 20 for 20%
  fixedRateEgp?: number;   // e.g. 200 EGP per session
  categoryOverrides?: Record<string, number>; // e.g. { 'بوتوكس وفيلر': 25, 'ليزر وإزالة شعر': 15 }
}

export interface DoctorEarningEntry {
  id: string;
  sessionRefId: string; // Unique ID of the clinical session (prevents double counting)
  doctorId: string;
  doctorName: string;
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
    rateType: 'percentage',
    percentageRate: 20, // 20% commission on laser & aesthetic sessions
    categoryOverrides: {
      'ليزر وإزالة شعر': 20,
      'بوتوكس وفيلر': 25,
      'عناية بالبشرة وهيدرافيشل': 15,
    },
  },
  {
    doctorId: 'doc-2',
    doctorName: 'د. طارق منصور',
    specialty: 'جراحة التجميل وحقن الفيلر والبوتوكس',
    rateType: 'percentage',
    percentageRate: 30, // 30% commission on aesthetic injectables
    categoryOverrides: {
      'بوتوكس وفيلر': 30,
      'خيوط تجميلية': 35,
    },
  },
  {
    doctorId: 'doc-3',
    doctorName: 'أخصائية البشرة ندى',
    specialty: 'عناية بالبشرة وهيدرافيشل',
    rateType: 'percentage',
    percentageRate: 15, // 15% per facial care session
  },
  {
    doctorId: 'doc-4',
    doctorName: 'أخصائية السبا فاطمة',
    specialty: 'سبا ومساج وحمام مغربي',
    rateType: 'fixed_per_session',
    fixedRateEgp: 150, // 150 EGP per royal hammam session
  },
  {
    doctorId: 'doc-5',
    doctorName: 'أخصائية الجسم مريم',
    specialty: 'عناية بالجسم وسكراب',
    rateType: 'fixed_per_session',
    fixedRateEgp: 120, // 120 EGP per body care session
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
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
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

// Record a settlement payout to doctor
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

  const newPayout: DoctorPayout = {
    id: `payo-${Date.now()}`,
    doctorId: params.doctorId,
    doctorName: params.doctorName,
    amountEgp: params.amountEgp,
    date: new Date().toISOString(),
    paymentMethod: params.paymentMethod,
    referenceNo: params.referenceNo,
    settledEarningIds: settledIds,
    notes: params.notes,
  };

  saveDoctorPayouts([newPayout, ...payouts]);
  return newPayout;
}
