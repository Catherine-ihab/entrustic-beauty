export enum ClinicType {
  GENERAL_MEDICAL = 'general_medical',
  DENTAL = 'dental',
  DERMATOLOGY = 'dermatology',
  PHYSIOTHERAPY = 'physiotherapy',
  REHABILITATION = 'rehabilitation',
  NUTRITION = 'nutrition',
  PSYCHOLOGY = 'psychology',
  ORTHOPEDIC = 'orthopedic',
  OPHTHALMOLOGY = 'ophthalmology',
  ENT = 'ent',
  PEDIATRICS = 'pediatrics',
  GYNECOLOGY = 'gynecology',
  AESTHETIC = 'aesthetic',
  OTHER = 'other',
  CUSTOM = 'custom',
}

export enum ClinicStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  PENDING = 'pending',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export enum VisitStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  AMENDED = 'amended',
  ARCHIVED = 'archived',
  VOIDED = 'voided',
}

export enum SequenceType {
  PATIENT = 'PATIENT',
  INVOICE = 'INVOICE',
  LAB = 'LAB',
}
