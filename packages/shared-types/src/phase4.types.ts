export enum BeforeAfterImageType {
  BEFORE = 'before',
  AFTER = 'after',
}

export interface IBeforeAfterImage {
  id: string;
  clinicId: string;
  recordId: string;
  storageKey: string;
  url: string; // Presigned URL
  imageType: BeforeAfterImageType;
  caption?: string | null;
  takenAt?: string | null;
  createdAt: string;
}

export interface IBeforeAfterRecord {
  id: string;
  clinicId: string;
  patientId: string;
  title: string;
  treatmentDescription?: string | null;
  notes?: string | null;
  recordedDate: string;
  images: IBeforeAfterImage[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeforeAfterRecordDto {
  patientId: string;
  title: string;
  treatmentDescription?: string;
  notes?: string;
  recordedDate: string;
  images: Array<{
    imageType: BeforeAfterImageType;
    storageKey: string;
    caption?: string;
    takenAt?: string;
  }>;
}

export interface IAuditLogEntry {
  id: string;
  clinicId?: string | null;
  userId: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
