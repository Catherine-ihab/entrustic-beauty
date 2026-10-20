import { IAuthUser, IClinicPublicConfig } from './interfaces';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: IAuthUser;
  clinic?: IClinicPublicConfig | null;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
    details?: any;
  }>;
  timestamp: string;
}
