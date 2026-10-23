// Clinic Daily Queue System (نظام طابور العيادة اليومي المترابط)
// Connects Front-Desk / Cashier / Invoices directly with Doctor Workspaces
// Fully Delay-Tolerant: Appointments never auto-expire; doctors always get the next patient in sequence.

export type ServiceCategory = 'laser' | 'injectables' | 'skincare' | 'bodycare' | 'spa' | 'general';
export type QueueStatus = 'waiting' | 'calling' | 'in-progress' | 'done' | 'cancelled';

export interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientNumber: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  packageName?: string;
  packageSessionNumber?: number; // e.g., 2
  packageTotalSessions?: number; // e.g., 4
  invoiceId?: string;
  invoiceNumber?: string;
  paidAmount?: number;
  totalAmount?: number;
  isPaid: boolean;
  scheduledTime: string; // e.g., "03:00 PM"
  status: QueueStatus;
  addedAt: string; // ISO string
  startedAt?: string;
  completedAt?: string;
  doctorNotes?: string;
  practitioner?: string;
}

const STORAGE_KEY = 'clinic_daily_queue_clean_v1';
export const QUEUE_EVENT_NAME = 'clinic_queue_updated';

// Clean empty queue by default so user can test adding and seeing actual data
const INITIAL_QUEUE: QueueEntry[] = [];

// Helper to infer category from service description
export function detectServiceCategory(text: string): ServiceCategory {
  const lower = (text || '').toLowerCase();
  if (
    lower.includes('ليزر') ||
    lower.includes('laser') ||
    lower.includes('candela') ||
    lower.includes('كانديلا') ||
    lower.includes('دايود') ||
    lower.includes('diode') ||
    lower.includes('إزالة شعر') ||
    lower.includes('رتوش')
  ) {
    return 'laser';
  }
  if (
    lower.includes('بوتوكس') ||
    lower.includes('botox') ||
    lower.includes('فيلر') ||
    lower.includes('filler') ||
    lower.includes('حقن') ||
    lower.includes('تكساس') ||
    lower.includes('شفاه') ||
    lower.includes('ابتسامة لثوية') ||
    lower.includes('خيوط') ||
    lower.includes('threads')
  ) {
    return 'injectables';
  }
  if (
    lower.includes('سكراب') ||
    lower.includes('سيلوليت') ||
    lower.includes('تفتيح مناطق') ||
    lower.includes('أفخاذ') ||
    lower.includes('ركب') ||
    lower.includes('أكواع') ||
    lower.includes('body care') ||
    lower.includes('تقشير جسم')
  ) {
    return 'bodycare';
  }
  if (
    lower.includes('مساج') ||
    lower.includes('massage') ||
    lower.includes('سبا') ||
    lower.includes('spa') ||
    lower.includes('حمام مغربي') ||
    lower.includes('حمام تركي')
  ) {
    return 'spa';
  }
  if (
    lower.includes('هيدرافيشل') ||
    lower.includes('hydrafacial') ||
    lower.includes('ماسك') ||
    lower.includes('mask') ||
    lower.includes('تقشير') ||
    lower.includes('peeling') ||
    lower.includes('بشرة') ||
    lower.includes('وجه') ||
    lower.includes('facial') ||
    lower.includes('ديرمابن') ||
    lower.includes('ميكرونيدلينج')
  ) {
    return 'skincare';
  }
  if (lower.includes('جسم') || lower.includes('body')) {
    return 'bodycare';
  }
  return 'general';
}

// Get the full queue
export function getQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUEUE));
      return INITIAL_QUEUE;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (_) {}
  return INITIAL_QUEUE;
}

// Save queue and broadcast event for instant multi-view sync
export function saveQueue(queue: QueueEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(QUEUE_EVENT_NAME, { detail: queue }));
    }
  } catch (_) {}
}

// Clear the entire queue (useful for clean testing)
export function clearQueue(): void {
  saveQueue([]);
}

// Add an entry to the queue (called from Cashier/Invoices upon payment or send-to-doctor)
export function addToQueue(
  entry: Omit<QueueEntry, 'id' | 'addedAt'> & { id?: string }
): QueueEntry {
  const current = getQueue();
  const newEntry: QueueEntry = {
    ...entry,
    id: entry.id || `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    addedAt: new Date().toISOString(),
    status: entry.status || 'waiting',
  };

  const updated = [newEntry, ...current];
  saveQueue(updated);
  return newEntry;
}

// Update the status of a queue entry
export function updateQueueEntry(
  id: string,
  updates: Partial<QueueEntry>
): QueueEntry | null {
  const current = getQueue();
  let updatedEntry: QueueEntry | null = null;
  const updated = current.map((item) => {
    if (item.id === id) {
      updatedEntry = { ...item, ...updates };
      return updatedEntry;
    }
    return item;
  });

  if (updatedEntry) {
    saveQueue(updated);
  }
  return updatedEntry;
}

// Start a patient session (marks in-progress and sets startedAt)
export function startQueueSession(id: string, practitioner?: string): QueueEntry | null {
  return updateQueueEntry(id, {
    status: 'in-progress',
    startedAt: new Date().toISOString(),
    practitioner: practitioner || undefined,
  });
}

// Finish a patient session (marks done and sets completedAt)
export function finishQueueSession(id: string, notes?: string): QueueEntry | null {
  return updateQueueEntry(id, {
    status: 'done',
    completedAt: new Date().toISOString(),
    doctorNotes: notes || undefined,
  });
}

// Automatically finish session by patient name (when session form is saved)
export function finishQueueSessionByPatient(patientName: string, notes?: string): boolean {
  if (!patientName) return false;
  const queue = getQueue();
  const cleanName = patientName.trim().toLowerCase();
  const activeItem = queue.find(
    (item) =>
      (item.status === 'in-progress' || item.status === 'waiting' || item.status === 'calling') &&
      item.patientName.trim().toLowerCase() === cleanName
  );

  if (activeItem) {
    finishQueueSession(activeItem.id, notes);
    return true;
  }
  return false;
}

// Call a patient to room
export function callQueuePatient(id: string): QueueEntry | null {
  return updateQueueEntry(id, {
    status: 'calling',
  });
}

// Subscribe to queue changes
export function subscribeToQueue(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => callback();
  window.addEventListener(QUEUE_EVENT_NAME, handleUpdate);
  window.addEventListener('storage', handleUpdate);

  // Poll fallback every 3 seconds
  const interval = setInterval(callback, 3000);

  return () => {
    window.removeEventListener(QUEUE_EVENT_NAME, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    clearInterval(interval);
  };
}

// Category display labels
export const CATEGORY_LABELS: Record<ServiceCategory, { ar: string; en: string; color: string }> = {
  laser: { ar: 'عيادة الليزر', en: 'Laser Clinic', color: '#be185d' },
  injectables: { ar: 'حقن الفيلر والبوتوكس', en: 'Injectables & Botox', color: '#831843' },
  skincare: { ar: 'العناية بالوجه والماسكات', en: 'Facial Care & Masks', color: '#0369A1' },
  bodycare: { ar: 'العناية بالجسم والسنفرة', en: 'Body Care & Scrubs', color: '#047857' },
  spa: { ar: 'السبا والمساج والحمام المغربي', en: 'Spa & Massage', color: '#B45309' },
  general: { ar: 'خدمات عامة', en: 'General Services', color: '#64748b' },
};
