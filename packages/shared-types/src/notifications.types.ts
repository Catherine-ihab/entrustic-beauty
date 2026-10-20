/**
 * Reminders & Messaging (WhatsApp/SMS) — shared DTOs (clinic-scoped).
 */

export type NotificationChannel = 'sms' | 'whatsapp';
export type NotificationStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface INotification {
  id: string;
  patientId?: string;
  patientName?: string;
  patientNumber?: string;
  appointmentId?: string;
  appointmentTime?: string;
  templateKey?: string;
  channel: NotificationChannel;
  recipient: string;
  body: string;
  status: NotificationStatus;
  provider: string;
  providerMessageId?: string;
  error?: string;
  attempts: number;
  scheduledAt: string;
  sentAt?: string;
  createdAt: string;
}

export interface INotificationTemplate {
  id: string;
  key: string;
  channel: NotificationChannel;
  name: string;
  body: string;
  isActive: boolean;
}

export interface UpdateNotificationTemplateDto {
  name?: string;
  body?: string;
  isActive?: boolean;
}

export interface IReminderSettings {
  appointmentReminders: boolean;
  reminderMinutesBefore: number;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxAttempts: number;
}

export interface UpdateReminderSettingsDto {
  appointmentReminders?: boolean;
  reminderMinutesBefore?: number;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  /** Must be provided together — both set a window, both null clear it. */
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  maxAttempts?: number;
}

export interface SendNotificationDto {
  patientId: string;
  channel: NotificationChannel;
  body: string;
}

export interface RunDueResult {
  queued: number;
  sent: number;
  failed: number;
}
