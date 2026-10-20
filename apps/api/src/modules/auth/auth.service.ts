import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import * as argon2 from 'argon2';
import {
  LoginRequestDto,
  LoginResponseDto,
  IJwtPayload,
  IAuthUser,
  UserStatus,
  ClinicStatus,
} from '@clinic/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAndLogin(
    dto: LoginRequestDto,
    tenantSlug?: string | null,
  ): Promise<LoginResponseDto> {
    let clinicId: string | null = null;
    let clinic = null;

    if (tenantSlug) {
      clinic = await this.tenantsService.findBySlug(tenantSlug);
      if (!clinic) {
        throw new UnauthorizedException('Clinic not found');
      }
      if (clinic.status === ClinicStatus.DEACTIVATED) {
        throw new ForbiddenException('This clinic has been deactivated.');
      }
      clinicId = clinic.id;
    }

    // Try finding user within tenant context, or platform admin if no tenant slug
    let user = await this.usersService.findByEmailAndClinic(dto.email, clinicId);

    // Allow platform admins to log in via the platform admin portal (no tenant slug)
    if (!user && !tenantSlug) {
      user = await this.usersService.findPlatformAdminByEmail(dto.email);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.LOCKED || user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Your account is currently disabled or locked.');
    }

    const isMatch = await argon2.verify(user.password_hash, dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roleNames = (user.roles || []).map((r) => r.name);
    const permissions = Array.from(
      new Set(
        (user.roles || []).flatMap((r) =>
          (r.permissions || []).map((p) => `${p.resource}:${p.action}`),
        ),
      ),
    );

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      clinic_id: user.clinic_id,
      is_platform_admin: user.is_platform_admin,
      roles: roleNames,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    const authUser: IAuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      clinicId: user.clinic_id,
      status: user.status,
      isPlatformAdmin: user.is_platform_admin,
      roles: roleNames,
      permissions,
    };

    const publicConfig = tenantSlug
      ? await this.tenantsService.getPublicConfigBySlug(tenantSlug)
      : null;

    return {
      accessToken,
      user: authUser,
      clinic: publicConfig,
    };
  }
}
