export enum InvoiceItemType {
  SERVICE = 'service',
  CUSTOM = 'custom',
}

export interface IVisitVersion {
  id: string;
  clinicId: string;
  visitId: string;
  versionNumber: number;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  clinicalNotes?: string | null;
  followUpDate?: string | null;
  customFields?: Record<string, any>;
  changeReason?: string | null;
  changedBy: string;
  changedAt: string;
}

export interface IVisit {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId?: string | null;
  providerId: string;
  originalVisitDate: string;
  status: string;
  currentVersion: number;
  versions?: IVisitVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitDto {
  patientId: string;
  appointmentId?: string;
  providerId: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  clinicalNotes?: string;
  followUpDate?: string;
  customFields?: Record<string, any>;
}

export interface AmendVisitDto {
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  clinicalNotes?: string;
  followUpDate?: string;
  customFields?: Record<string, any>;
  changeReason: string; // Mandatory for medical audit trail
}

export interface IInvoiceItem {
  id: string;
  clinicId: string;
  invoiceId: string;
  serviceId?: string | null;
  description: string; // Snapshot at issue time
  unitPrice: number;   // Snapshot at issue time
  quantity: number;
  lineTotal: number;
}

export interface IInvoice {
  id: string;
  clinicId: string;
  patientId: string;
  invoiceNumber: string; // Atomic sequential e.g. INV-2026-00001
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  status: string;
  items?: IInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceItemDto {
  serviceId?: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateInvoiceDto {
  patientId: string;
  issueDate: string;
  dueDate?: string;
  discountAmount?: number;
  taxAmount?: number;
  items: CreateInvoiceItemDto[];
}

export interface RecordPaymentDto {
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}
