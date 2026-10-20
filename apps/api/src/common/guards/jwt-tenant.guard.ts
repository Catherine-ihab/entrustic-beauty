import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../middleware/tenant-resolution.middleware';
import { IJwtPayload } from '@clinic/shared-types';

@Injectable()
export class JwtTenantGuard extends AuthGuard('jwt') {
  constructor(private readonly cls: ClsService) {
    super();
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new ForbiddenException('Invalid or missing authentication credentials');
    }

    const payload = user as IJwtPayload;

    // Platform Super Admin bypasses clinic tenant binding
    if (payload.is_platform_admin) {
      return payload as unknown as TUser;
    }

    // Tenant isolation verification:
    // If request arrived via a specific tenant subdomain, ensure user token belongs to this clinic
    const currentTenantId = this.cls.get<string>(TENANT_ID_KEY);
    if (currentTenantId && payload.clinic_id && payload.clinic_id !== currentTenantId) {
      throw new ForbiddenException(
        'Access Denied: You do not have permission to access this clinic.',
      );
    }

    // If tenant was not identified by subdomain, bind from verified JWT token
    if (!currentTenantId && payload.clinic_id) {
      this.cls.set(TENANT_ID_KEY, payload.clinic_id);
    }

    return payload as unknown as TUser;
  }
}
