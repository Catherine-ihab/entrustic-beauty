import { ClinicStatus, ClinicType, UserStatus } from './enums';

export interface IClinicBranding {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;
  welcomeMessage?: string | null;
}

export interface IClinicPublicConfig {
  id: string;
  name: string;
  slug: string;
  clinicType: ClinicType;
  specialties?: ClinicType[];
  status: ClinicStatus;
  defaultLanguage: string;
  currency: string;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  branding: IClinicBranding;
  enabledModules: string[];
}

export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  clinicId: string | null;
  status: UserStatus;
  isPlatformAdmin: boolean;
  roles: string[];
  permissions: string[];
}

export interface IJwtPayload {
  sub: string;
  email: string;
  clinic_id: string | null;
  is_platform_admin: boolean;
  roles: string[];
  permissions: string[];
  /** Absent/'staff' for platform logins; 'patient' for patient-portal tokens. */
  type?: 'staff' | 'patient';
  /** Patient-portal tokens only — always === sub. */
  patient_id?: string;
  iat?: number;
  exp?: number;
}
