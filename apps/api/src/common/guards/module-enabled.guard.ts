import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../../modules/tenants/tenants.service';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../middleware/tenant-resolution.middleware';

export const MODULE_KEY = 'module_key';
export const RequireModule = (moduleKey: string) =>
  Reflector.createDecorator<string>()(moduleKey);

@Injectable()
export class ModuleEnabledGuard {
  constructor(
    private reflector: Reflector,
    private tenantsService: TenantsService,
    private cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>(
      MODULE_KEY,
      context.getHandler(),
    );

    if (!requiredModule) {
      return true;
    }

    const tenantId = this.cls.get<string>(TENANT_ID_KEY);
    if (!tenantId) {
      throw new ForbiddenException('Tenant identification missing');
    }

    const isEnabled = await this.tenantsService.isModuleEnabled(
      tenantId,
      requiredModule,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `The module '${requiredModule}' is not licensed or enabled for this clinic.`,
      );
    }

    return true;
  }
}
