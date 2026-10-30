// Central Unified Invoices Store (إدارة وتخزين الفواتير المركزية المشتركة)
import { IInvoice, InvoiceStatus } from '@clinic/shared-types';
import dayjs from 'dayjs';
import { apiClient } from './api-client';

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

const mapApiInvoice = (inv: any): IInvoice => ({
  id: inv.id,
  clinicId: inv.clinic_id || inv.clinicId || 'clinic-1',
  patientId: inv.patient_id || inv.patientId || inv.patient?.id || '',
  invoiceNumber: inv.invoice_number || inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`,
  currency: inv.currency || 'EGP',
  issueDate: inv.issue_date || inv.issueDate || new Date().toISOString(),
  dueDate: inv.due_date || inv.dueDate || null,
  subtotal: Number(inv.subtotal ?? 0),
  discountAmount: Number(inv.discount_amount ?? inv.discountAmount ?? 0),
  taxAmount: Number(inv.tax_amount ?? inv.taxAmount ?? 0),
  total: Number(inv.total ?? 0),
  paidAmount: Number(inv.paid_amount ?? inv.paidAmount ?? 0),
  status: inv.status || InvoiceStatus.ISSUED,
  items: (inv.items || []).map((it: any, idx: number) => ({
    id: it.id || `it-${idx}`,
    clinicId: it.clinic_id || it.clinicId || 'clinic-1',
    invoiceId: it.invoice_id || it.invoiceId || inv.id,
    serviceId: it.service_id || it.serviceId || null,
    description: it.description || 'Medical Service',
    unitPrice: Number(it.unit_price ?? it.unitPrice ?? 0),
    quantity: Number(it.quantity ?? 1),
    lineTotal: Number(it.line_total ?? it.lineTotal ?? 0),
  })),
  createdAt: inv.created_at || inv.createdAt || new Date().toISOString(),
  updatedAt: inv.updated_at || inv.updatedAt || new Date().toISOString(),
});

let syncInflight: Promise<IInvoice[]> | null = null;

export async function syncInvoicesFromApi(): Promise<IInvoice[]> {
  if (syncInflight) return syncInflight;

  syncInflight = apiClient
    .get('/invoices')
    .then((res: any) => {
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      if (list.length > 0) {
        const mapped = list.map(mapApiInvoice);
        // Retain local client-created invoices that are not yet synced to backend
        const serverIds = new Set(mapped.map((i: IInvoice) => i.id));
        const currentLocal = getClinicInvoices();
        const pendingLocal = currentLocal.filter((i: IInvoice) => i.id.startsWith('inv-') && !serverIds.has(i.id));

        const merged = [...mapped, ...pendingLocal];
        saveClinicInvoices(merged);
        return merged;
      }
      return getClinicInvoices();
    })
    .catch((err) => {
      console.warn('Could not sync invoices from server API, using local cache:', err);
      return getClinicInvoices();
    })
    .finally(() => {
      syncInflight = null;
    });

  return syncInflight;
}

export function ensureInvoicesSynced(): Promise<IInvoice[]> {
  return syncInvoicesFromApi();
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

  // Background sync with PostgreSQL backend
  const isDbPatient = invoice.patientId && invoice.patientId.length > 20 && !invoice.patientId.startsWith('p-');
  if (isDbPatient || invoice.items?.length) {
    apiClient
      .post('/invoices', {
        patientId: invoice.patientId,
        currency: invoice.currency || 'EGP',
        issueDate: invoice.issueDate || new Date().toISOString(),
        dueDate: invoice.dueDate || undefined,
        discountAmount: invoice.discountAmount || 0,
        taxAmount: invoice.taxAmount || 0,
        items: (invoice.items || []).map((it) => ({
          serviceId: it.serviceId && it.serviceId.length > 20 ? it.serviceId : undefined,
          description: it.description,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        })),
      })
      .then((res: any) => {
        const created = res?.data ?? res;
        if (created?.id) {
          // If the invoice was already partially/fully paid, record payment to DB too
          if (invoice.paidAmount > 0) {
            apiClient.post(`/invoices/${created.id}/payments`, {
              amount: invoice.paidAmount,
              paymentMethod: 'cash',
            }).catch(() => {});
          }
          // Refresh list to update ID with real DB UUID
          syncInvoicesFromApi();
        }
      })
      .catch((err) => {
        console.warn('Could not save invoice to backend API, kept in local store:', err);
      });
  }
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

  // If this is a real DB invoice (UUID), record payment on backend API too
  if (invoiceId.length > 20 && !invoiceId.startsWith('inv-')) {
    apiClient
      .post(`/invoices/${invoiceId}/payments`, {
        amount: Number(additionalAmount),
        paymentMethod: 'cash',
      })
      .then(() => {
        syncInvoicesFromApi();
      })
      .catch((err) => {
        console.warn('Could not record payment on backend API:', err);
      });
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
