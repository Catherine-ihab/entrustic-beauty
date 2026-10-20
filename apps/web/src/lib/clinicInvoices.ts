// Central Unified Invoices Store (إدارة وتخزين الفواتير المركزية المشتركة)
import { IInvoice, InvoiceStatus } from '@clinic/shared-types';
import dayjs from 'dayjs';

export const INVOICES_STORAGE_KEY = 'clinic_invoices_v1';
export const INVOICES_EVENT_NAME = 'clinic_invoices_updated';

export const INITIAL_INVOICES: IInvoice[] = [
  {
    id: 'inv-1',
    clinicId: 'clinic-1',
    patientId: 'p-lina',
    invoiceNumber: 'INV-2026-00001',
    currency: 'EGP',
    issueDate: dayjs().subtract(3, 'day').toISOString(),
    subtotal: 6500.0,
    discountAmount: 500.0,
    taxAmount: 0.0,
    total: 6000.0,
    paidAmount: 3000.0,
    status: InvoiceStatus.PARTIALLY_PAID,
    items: [
      {
        id: 'item-1',
        clinicId: 'clinic-1',
        invoiceId: 'inv-1',
        description: 'باكدج ليزر كانديلا كامل الجسم (6 جلسات) — لينا الحسن (PAT-00104)',
        unitPrice: 6500.0,
        quantity: 1,
        lineTotal: 6500.0,
      },
    ],
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().subtract(3, 'day').toISOString(),
  },
  {
    id: 'inv-2',
    clinicId: 'clinic-1',
    patientId: 'p-maryam',
    invoiceNumber: 'INV-2026-00002',
    currency: 'EGP',
    issueDate: dayjs().subtract(1, 'day').toISOString(),
    subtotal: 1650.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    total: 1650.0,
    paidAmount: 1650.0,
    status: InvoiceStatus.PAID,
    items: [
      {
        id: 'item-2a',
        clinicId: 'clinic-1',
        invoiceId: 'inv-2',
        description: 'جلسة هيدرافيشل سينديو — مريم الصاوي (PAT-00120)',
        unitPrice: 1200.0,
        quantity: 1,
        lineTotal: 1200.0,
      },
      {
        id: 'item-2b',
        clinicId: 'clinic-1',
        invoiceId: 'inv-2',
        description: 'ماسك الذهب 24K',
        unitPrice: 450.0,
        quantity: 1,
        lineTotal: 450.0,
      },
    ],
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'inv-3',
    clinicId: 'clinic-1',
    patientId: 'p-rania',
    invoiceNumber: 'INV-2026-00003',
    currency: 'EGP',
    issueDate: dayjs().toISOString(),
    subtotal: 5500.0,
    discountAmount: 500.0,
    taxAmount: 0.0,
    total: 5000.0,
    paidAmount: 0.0,
    status: InvoiceStatus.ISSUED,
    items: [
      {
        id: 'item-3',
        clinicId: 'clinic-1',
        invoiceId: 'inv-3',
        description: 'حقن فيلر شفاه + بوتوكس الجبهة — رانيا توفيق (PAT-00055)',
        unitPrice: 5500.0,
        quantity: 1,
        lineTotal: 5500.0,
      },
    ],
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
  },
];

export function getClinicInvoices(): IInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_) {}
  return INITIAL_INVOICES;
}

export function saveClinicInvoices(invoices: IInvoice[]): void {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(INVOICES_EVENT_NAME, { detail: invoices }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (_) {}
}

export function addClinicInvoice(invoice: IInvoice): void {
  const current = getClinicInvoices();
  const exists = current.findIndex((i) => i.id === invoice.id);
  let updated: IInvoice[];
  if (exists >= 0) {
    updated = current.map((i) => (i.id === invoice.id ? invoice : i));
  } else {
    updated = [invoice, ...current];
  }
  saveClinicInvoices(updated);
}

export function recordInvoicePayment(invoiceId: string, additionalAmount: number): IInvoice | null {
  const current = getClinicInvoices();
  let updatedInvoice: IInvoice | null = null;
  const updated = current.map((inv) => {
    if (inv.id !== invoiceId) return inv;
    const newPaid = Math.min(Number(inv.paidAmount) + Number(additionalAmount), Number(inv.total));
    const newStatus =
      newPaid >= Number(inv.total) ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
    updatedInvoice = {
      ...inv,
      paidAmount: newPaid,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    return updatedInvoice;
  });
  if (updatedInvoice) {
    saveClinicInvoices(updated);
  }
  return updatedInvoice;
}

export function subscribeToInvoices(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handle = () => callback();
  window.addEventListener(INVOICES_EVENT_NAME, handle);
  window.addEventListener('storage', handle);
  return () => {
    window.removeEventListener(INVOICES_EVENT_NAME, handle);
    window.removeEventListener('storage', handle);
  };
}
