import { ClinicStatus, ClinicType } from './enums';
import { IClinicBranding } from './interfaces';

export interface CreateClinicDto {
  name: string;
  slug: string;
  clinicType: ClinicType;
  specialties?: ClinicType[];
  currency: string;
  defaultLanguage?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  address?: string;
  branding?: {
    primaryColor: string;
    secondaryColor?: string;
    welcomeMessage?: string;
    logoUrl?: string;
  };
  enabledModules?: string[];
  owner: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface UpdateClinicPlatformDto {
  name?: string;
  clinicType?: ClinicType;
  specialties?: ClinicType[];
  status?: ClinicStatus;
  currency?: string;
  timezone?: string;
  defaultLanguage?: string;
  branding?: Partial<IClinicBranding>;
  enabledModules?: string[];
}

export interface IPlatformClinicSummary {
  id: string;
  name: string;
  slug: string;
  clinicType: ClinicType;
  specialties?: ClinicType[];
  status: ClinicStatus;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  branding: IClinicBranding;
  enabledModules: string[];
  createdAt: string;
  updatedAt: string;
}
