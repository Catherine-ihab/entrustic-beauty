/**
 * Phase A5 — Patient Portal + Telemedicine (shared across all specialties).
 *
 * Portal auth is phone/email + one-time code (delivered through the same
 * messaging providers as reminders — console driver by default), issuing a
 * patient-scoped JWT (type: 'patient'). Telemedicine rooms live on the
 * appointment itself (visit_type='telemedicine' + room_code); all WebRTC
 * signaling (offer/answer/ice) plus join/leave presence and chat travel over
 * the persistent `telemedicine_signals` table via short polling — zero new
 * dependencies.
 */

export enum VisitType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
}

export enum TelemedSender {
  PATIENT = 'patient',
  PROVIDER = 'provider',
}

export enum TelemedSignalKind {
  JOIN = 'join',
  LEAVE = 'leave',
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE = 'ice',
  CHAT = 'chat',
}

/** Room presence: neither joined / patient waiting / provider waiting / both in. */
export type TelemedRoomPhase = 'not_started' | 'waiting' | 'provider_waiting' | 'connected';

export interface ITelemedSignal {
  id: string;
  appointmentId: string;
  sender: TelemedSender;
  kind: TelemedSignalKind;
  payload: string | null;
  seq: number;
  createdAt: string;
}

export interface ITelemedRoomState {
  appointmentId: string;
  roomCode: string | null;
  visitType: VisitType;
  appointmentStatus: string;
  startTime: string;
  endTime: string;
  patientId: string;
  patientName: string;
  providerName: string;
  notes: string | null;
  patientPresent: boolean;
  providerPresent: boolean;
  phase: TelemedRoomPhase;
}

export interface ISignalPage {
  signals: ITelemedSignal[];
  latestSeq: number;
}

export interface PostSignalDto {
  kind: TelemedSignalKind;
  payload?: string;
}

// ─── Patient portal auth ─────────────────────────────────────────────────────

export interface RequestPortalCodeDto {
  /** Fallback to subdomain / x-tenant-slug when omitted (dev convenience). */
  clinicSlug?: string;
  /** Patient phone (+201000000000 / 01000000000) or email. */
  identifier: string;
  channel?: 'sms' | 'whatsapp';
}

export interface PortalCodeResponse {
  sent: true;
  channel: 'sms' | 'whatsapp';
  /** Masked destination, e.g. +201••••000. */
  recipient: string;
  expiresInMinutes: number;
  /** Present only when the console (demo) messaging driver is active. */
  devCode?: string;
}

export interface VerifyPortalCodeDto {
  clinicSlug?: string;
  identifier: string;
  code: string;
}

export interface IPortalPatientSummary {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: string;
  dateOfBirth: string | null;
  bloodType: string | null;
  allergies: string | null;
}

export interface IPortalSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  patient: IPortalPatientSummary;
}

export interface IPortalMe extends IPortalPatientSummary {
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  activeAllergies: Array<{ allergen: string; severity: string; reaction: string | null }>;
}

// ─── Portal reads / booking ──────────────────────────────────────────────────

export interface BookAppointmentDto {
  providerId: string;
  serviceId?: string;
  startTime: string;
  /** Defaults to the service's default duration (or 30 min). */
  endTime?: string;
  visitType?: VisitType;
  notes?: string;
}

export interface PortalAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  visitType: VisitType;
  roomCode: string | null;
  providerName: string;
  serviceName: string | null;
  notes: string | null;
  cancellationReason: string | null;
}

export interface PortalProviderOption {
  id: string;
  fullName: string;
}

export interface PortalServiceOption {
  id: string;
  name: string;
  defaultDurationMinutes: number;
  currentPrice: number;
  currency: string;
}

export interface PortalPrescription {
  id: string;
  issuedAt: string;
  status: string;
  notes: string | null;
  items: Array<{
    drugName: string;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    quantity: number | null;
  }>;
}

export interface PortalLabResult {
  id: string;
  requestNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  completedAt: string | null;
  items: Array<{
    testName: string;
    value: string | null;
    unit: string | null;
    flag: string | null;
    status: string;
  }>;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  status: string;
  items: Array<{ description: string; unitPrice: number; quantity: number; lineTotal: number }>;
}

// ─── Staff telemedicine room list ────────────────────────────────────────────

export interface TelemedRoomListItem {
  appointmentId: string;
  roomCode: string | null;
  startTime: string;
  endTime: string;
  status: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  providerName: string;
  patientPresent: boolean;
  providerPresent: boolean;
  phase: TelemedRoomPhase;
}
