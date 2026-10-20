import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IJwtPayload } from '@clinic/shared-types';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: IJwtPayload }>();
    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    if (user.is_platform_admin) {
      return true;
    }

    const userPermissions = new Set(user.permissions || []);
    const hasAll = requiredPermissions.every((perm) => userPermissions.has(perm));

    if (!hasAll) {
      throw new ForbiddenException(
        'You do not have the required permissions to perform this action.',
      );
    }

    return true;
  }
}
