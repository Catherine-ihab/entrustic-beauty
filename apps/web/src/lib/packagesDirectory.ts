// Unified Clinic Packages Directory (دليل باقات العيادة المركزي المشترك)
// Shared across Packages Manager, Invoices & Billing, Appointments & Booking, and Clinical Workspaces

export type PackageCategory =
  | 'ليزر وإزالة شعر'
  | 'عناية بالبشرة'
  | 'حقن وبوتوكس وفيلر'
  | 'عناية بالجسم وسكراب'
  | 'سبا ومساج'
  | 'باكدج ميكس شامل';

export interface ClinicPackage {
  id: string;
  name: string;
  category: PackageCategory;
  totalSessions: number;
  priceEgp: number;
  includedServices: string[]; // List of included services & areas
  validityMonths: number;
  notes?: string;
}

// Available clinic services & treatment areas for Checkbox selection
export const AVAILABLE_PACKAGE_SERVICES = [
  // ليزر
  'ليزر كامل الجسم (Full Body Laser)',
  'ليزر البكيني وتحت الإبط (Bikini & Underarm)',
  'ليزر الساقين كاملة (Full Legs)',
  'ليزر الذراعين كاملة (Full Arms)',
  'ليزر الوجه والرقبة (Face & Neck)',
  'جلسة رتوش مجانية (Free Touch-up)',
  'كريم مهدئ بعد الليزر (Soothing Cream)',

  // عناية بالوجه وبشرة
  'تنظيف مائي عميق هيدرافيشل (HydraFacial)',
  'ماسك الذهب عيار 24K الفاخر (24K Gold Mask)',
  'ماسك الكولاجين البحري المركز (Marine Collagen)',
  'ماسك الهيدروجيل بالهيالورونيك (HA Hydrogel)',
  'جلسة تقشير كيميائي للأحماض (Chemical Peel)',
  'ديرمابن 4 ميكرونيدلينج (Dermapen 4)',
  'قناع الضوء العلاجي للوجه LED (LED Therapy)',
  'مطرقة التبريد لغلق المسام (Cryo Hammer)',

  // حقن وبوتوكس
  'حقن بوتوكس كامل الجبهة والعيون (Botox Full Upper)',
  'حقن فيلر الشفاه حمض هيالورونيك (HA Lip Filler)',
  'حقن فيلر الوجنات والفك (Cheek & Jawline)',
  'جلسة ميزوثيرابي نضارة (Mesotherapy Glow)',

  // عناية بالجسم وسكراب
  'سكراب القهوة العضوية وزبدة الشيا (Coffee Scrub)',
  'سنفرة ملح الحليب واللافندر للجسم (Milk Salt Scrub)',
  'بروتوكول تفتيح الركب والأكواع (Knees & Elbows Glow)',
  'تفتيح وتوحيد لون المناطق الحساسة (Intimate Brightening)',
  'علاج السيلوليت والتصريف اللمفاوي (Anti-Cellulite)',
  'ماسك الطين الوردي وترطيب الجسم (Pink Clay Wrap)',

  // سبا ومساج
  'حمام مغربي ملكي بالأعشاب والطفل (Moroccan Bath)',
  'حمام تركي برغوة الصابون وزيت الغار (Turkish Bath)',
  'مساج سويدي استرخائي 60 دقيقة (Swedish Massage)',
  'مساج الأحجار البركانية الساخنة (Hot Stone)',
];

const STORAGE_KEY = 'clinic_shared_packages_v2';
export const PACKAGES_EVENT_NAME = 'clinic_packages_updated';

// Default initial catalog of packages
const INITIAL_PACKAGES: ClinicPackage[] = [
  // ليزر
  {
    id: 'pkg-laser-full',
    name: 'باكدج كانديلا ليزر كامل الجسم (4 جلسات + رتوش)',
    category: 'ليزر وإزالة شعر',
    totalSessions: 4,
    priceEgp: 6000,
    includedServices: [
      'ليزر كامل الجسم (Full Body Laser)',
      'جلسة رتوش مجانية (Free Touch-up)',
      'كريم مهدئ بعد الليزر (Soothing Cream)',
    ],
    validityMonths: 12,
    notes: 'شامل جلسة رتوش بعد كل جلسة أساسية خلال 10-14 يوم.',
  },
  {
    id: 'pkg-laser-bikini',
    name: 'باكدج ليزر بكيني وأندر آرم (6 جلسات)',
    category: 'ليزر وإزالة شعر',
    totalSessions: 6,
    priceEgp: 1800,
    includedServices: [
      'ليزر البكيني وتحت الإبط (Bikini & Underarm)',
      'جلسة رتوش مجانية (Free Touch-up)',
    ],
    validityMonths: 12,
    notes: 'الأكثر طلباً للعرائس.',
  },

  // بشرة
  {
    id: 'pkg-skin-royal',
    name: 'باكدج النضارة الملكية (هيدرافيشل + ماسك الذهب 24K)',
    category: 'عناية بالبشرة',
    totalSessions: 3,
    priceEgp: 1200,
    includedServices: [
      'تنظيف مائي عميق هيدرافيشل (HydraFacial)',
      'ماسك الذهب عيار 24K الفاخر (24K Gold Mask)',
      'قناع الضوء العلاجي للوجه LED (LED Therapy)',
      'مطرقة التبريد لغلق المسام (Cryo Hammer)',
    ],
    validityMonths: 6,
    notes: 'تنظيف عميق وإشراقة تدوم لأسابيع.',
  },
  {
    id: 'pkg-skin-acne',
    name: 'باكدج تنقية المسام ومكافحة حب الشباب (4 جلسات)',
    category: 'عناية بالبشرة',
    totalSessions: 4,
    priceEgp: 850,
    includedServices: [
      'تنظيف مائي عميق هيدرافيشل (HydraFacial)',
      'جلسة تقشير كيميائي للأحماض (Chemical Peel)',
      'قناع الضوء العلاجي للوجه LED (LED Therapy)',
    ],
    validityMonths: 6,
    notes: 'بروتوكول علاجي للبشرة الدهنية والمعرضة للحبوب.',
  },

  // حقن وتجميل
  {
    id: 'pkg-inject-glow',
    name: 'بروتوكول تجديد شباب الوجه الكامل (بوتوكس + فيلر)',
    category: 'حقن وبوتوكس وفيلر',
    totalSessions: 1,
    priceEgp: 5000,
    includedServices: [
      'حقن بوتوكس كامل الجبهة والعيون (Botox Full Upper)',
      'حقن فيلر الشفاه حمض هيالورونيك (HA Lip Filler)',
    ],
    validityMonths: 6,
    notes: 'تنسيق ملامح وتنعيم تجاعيد التعبير.',
  },

  // جسم وسكراب
  {
    id: 'pkg-body-polish',
    name: 'باكدج نعومة وسنفرة الجسم الكامل بالقهوة والشيا (4 جلسات)',
    category: 'عناية بالجسم وسكراب',
    totalSessions: 4,
    priceEgp: 1900,
    includedServices: [
      'سكراب القهوة العضوية وزبدة الشيا (Coffee Scrub)',
      'ماسك الطين الوردي وترطيب الجسم (Pink Clay Wrap)',
    ],
    validityMonths: 12,
    notes: 'علاج جلد الوزة وتنعيم فائق لملمس الجسم.',
  },
  {
    id: 'pkg-body-bright',
    name: 'بروتوكول تفتيح الركب والأكواع والمناطق الحساسة (6 جلسات)',
    category: 'عناية بالجسم وسكراب',
    totalSessions: 6,
    priceEgp: 2400,
    includedServices: [
      'بروتوكول تفتيح الركب والأكواع (Knees & Elbows Glow)',
      'تفتيح وتوحيد لون المناطق الحساسة (Intimate Brightening)',
    ],
    validityMonths: 12,
    notes: 'تقشير لطيف بأحماض الفواكه مع مصل التفتيح المركز.',
  },

  // سبا ومساج
  {
    id: 'pkg-spa-moroccan',
    name: 'باكدج الحمام المغربي الملكي ومساج الاسترخاء (3 طقوس)',
    category: 'سبا ومساج',
    totalSessions: 3,
    priceEgp: 2500,
    includedServices: [
      'حمام مغربي ملكي بالأعشاب والطفل (Moroccan Bath)',
      'مساج سويدي استرخائي 60 دقيقة (Swedish Massage)',
    ],
    validityMonths: 12,
    notes: 'طقوس استرخاء ملكية بالصابون البلدي والزيوت العطرية.',
  },
];

export function getClinicPackages(): ClinicPackage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PACKAGES));
      return INITIAL_PACKAGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_) {}
  return INITIAL_PACKAGES;
}

export function saveClinicPackages(packages: ClinicPackage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PACKAGES_EVENT_NAME, { detail: packages }));
    }
  } catch (_) {}
}

export function saveClinicPackage(pkg: ClinicPackage): void {
  const current = getClinicPackages();
  const exists = current.findIndex((p) => p.id === pkg.id);
  let updated: ClinicPackage[];
  if (exists >= 0) {
    updated = current.map((p) => (p.id === pkg.id ? pkg : p));
  } else {
    updated = [pkg, ...current];
  }
  saveClinicPackages(updated);
}

export function deleteClinicPackage(id: string): void {
  const current = getClinicPackages();
  const updated = current.filter((p) => p.id !== id);
  saveClinicPackages(updated);
}

export function subscribeToPackages(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handle = () => callback();
  window.addEventListener(PACKAGES_EVENT_NAME, handle);
  window.addEventListener('storage', handle);

  return () => {
    window.removeEventListener(PACKAGES_EVENT_NAME, handle);
    window.removeEventListener('storage', handle);
  };
}

// ─── Client Package Enrollments (سجل اشتراكات وباقات العملاء المركزية) ───────────

export interface ClientPackageEnrollment {
  id: string;
  patientName: string;
  patientId: string;
  patientPhone: string;
  packageName: string;
  category: string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  priceEgp: number;
  paymentStatus: 'مدفوع بالكامل' | 'تقسيط / دفعة مقدمة' | 'معلق';
  paidAmountEgp: number;
  purchaseDate: string;
  expiryDate: string;
  status: 'نشطة' | 'مكتملة' | 'منتهية الصلاحية';
}

export const LS_ENROLLMENTS_KEY = 'clinic_package_enrollments_v2';
export const ENROLLMENTS_EVENT_NAME = 'clinic_enrollments_updated';

export const DEFAULT_ENROLLMENTS: ClientPackageEnrollment[] = [];

export function getClientPackageEnrollments(): ClientPackageEnrollment[] {
  try {
    const raw = localStorage.getItem(LS_ENROLLMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (_) {}
  return [];
}

export function saveClientPackageEnrollments(enrollments: ClientPackageEnrollment[]): void {
  try {
    localStorage.setItem(LS_ENROLLMENTS_KEY, JSON.stringify(enrollments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ENROLLMENTS_EVENT_NAME, { detail: enrollments }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (_) {}
}

export function enrollClientPackage(enrollment: Omit<ClientPackageEnrollment, 'id'>): ClientPackageEnrollment {
  const current = getClientPackageEnrollments();
  const newEnrollment: ClientPackageEnrollment = {
    ...enrollment,
    id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
  saveClientPackageEnrollments([newEnrollment, ...current]);
  return newEnrollment;
}

/**
 * Deduct/Redeem 1 session from a patient's active package enrollment
 * Can be called automatically by any workspace (Laser, Skincare, Bodycare, Spa, Injectables)
 */
export function redeemPackageSessionForPatient(
  patientNameOrId: string,
  categoryOrService?: string
): { success: boolean; enrollment?: ClientPackageEnrollment; message?: string } {
  if (!patientNameOrId) return { success: false, message: 'اسم أو رقم الحالة مطلوب' };

  const current = getClientPackageEnrollments();
  const normalizedSearch = patientNameOrId.trim().toLowerCase();

  // Find candidate enrollments for this patient
  const patientEnrollments = current.filter((e) => {
    if (e.status !== 'نشطة' || e.remainingSessions <= 0) return false;
    const nameMatch = e.patientName.toLowerCase().includes(normalizedSearch) ||
                      normalizedSearch.includes(e.patientName.toLowerCase());
    const idMatch = e.patientId.toLowerCase() === normalizedSearch;
    return nameMatch || idMatch;
  });

  if (patientEnrollments.length === 0) {
    return { success: false, message: 'لا توجد باقة نشطة بأرصدة متبقية لهذه الحالة' };
  }

  // If categoryOrService is specified, find matching package
  let target = patientEnrollments[0];
  if (categoryOrService) {
    const catSearch = categoryOrService.toLowerCase();
    const specific = patientEnrollments.find(
      (e) => e.category.toLowerCase().includes(catSearch) ||
             catSearch.includes(e.category.toLowerCase()) ||
             e.packageName.toLowerCase().includes(catSearch) ||
             catSearch.includes(e.packageName.toLowerCase())
    );
    if (specific) target = specific;
  }

  let updatedTarget: ClientPackageEnrollment | undefined;
  const updated = current.map((enr) => {
    if (enr.id === target.id) {
      const nextCompleted = enr.completedSessions + 1;
      const nextRemaining = enr.remainingSessions - 1;
      updatedTarget = {
        ...enr,
        completedSessions: nextCompleted,
        remainingSessions: nextRemaining,
        status: nextRemaining === 0 ? 'مكتملة' : 'نشطة',
      };
      return updatedTarget;
    }
    return enr;
  });

  saveClientPackageEnrollments(updated);
  return {
    success: true,
    enrollment: updatedTarget,
    message: `تم خصم جلسة بنجاح من باقة [${target.packageName}] — المتبقي ${updatedTarget?.remainingSessions} جلسة`,
  };
}

export function subscribeToPackageEnrollments(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handle = () => callback();
  window.addEventListener(ENROLLMENTS_EVENT_NAME, handle);
  window.addEventListener('storage', handle);
  return () => {
    window.removeEventListener(ENROLLMENTS_EVENT_NAME, handle);
    window.removeEventListener('storage', handle);
  };
}

// ─── Demo enrolment seeding against the real roster ──────────────────────────

/**
 * The enrolment table used to be seeded with invented patients (`PAT-00104`,
 * `01012345678`, …) that existed nowhere else in the system. Once the real
 * roster is known we rebuild the demo enrolments from real patients so every
 * screen shows the same names, numbers and phone numbers.
 *
 * Runs only when it finds an enrolment whose patient is not in the roster, so
 * enrolments the user creates by hand are never discarded.
 */
export function rebuildEnrollmentsFromPatients(
  _patients: Array<{ name: string; patientNumber: string; phone: string }>,
): ClientPackageEnrollment[] {
  return getClientPackageEnrollments();
}

