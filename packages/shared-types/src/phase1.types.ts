import { VisitType } from './telemedicine.types';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNSPECIFIED = 'unspecified',
}

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export interface IPatient {
  id: string;
  clinicId: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender: Gender;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  notes?: string | null;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  notes?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: PatientStatus;
}

export interface IClinicService {
  id: string;
  clinicId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  currentPrice: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicServiceDto {
  categoryId?: string;
  name: string;
  description?: string;
  defaultDurationMinutes?: number;
  currentPrice: number;
  sortOrder?: number;
}

export interface UpdateClinicServiceDto extends Partial<CreateClinicServiceDto> {
  isActive?: boolean;
}

export interface IAppointment {
  id: string;
  clinicId: string;
  patientId: string;
  patient?: IPatient;
  providerId: string;
  serviceId?: string | null;
  service?: IClinicService;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  cancellationReason?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  providerId: string;
  serviceId?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  /** Defaults to in_person; 'telemedicine' mints a room_code. */
  visitType?: VisitType;
}

export interface UpdateAppointmentDto {
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;
  cancellationReason?: string;
}
