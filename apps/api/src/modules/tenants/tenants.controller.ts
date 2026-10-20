import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { IClinicPublicConfig } from '@clinic/shared-types';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';

@Controller('clinics')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly cls: ClsService,
  ) {}

  @Get('public-config/:slug')
  async getPublicConfig(
    @Param('slug') slug: string,
  ): Promise<IClinicPublicConfig> {
    return this.tenantsService.getPublicConfigBySlug(slug);
  }

  @UseGuards(JwtTenantGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @Patch('current/profile')
  async updateProfile(@Body() body: any) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.tenantsService.updateProfile(clinicId, body);
  }

  @UseGuards(JwtTenantGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @Patch('current/branding')
  async updateBranding(@Body() body: any) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.tenantsService.updateBranding(clinicId, body);
  }

  @UseGuards(JwtTenantGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @Patch('current/modules')
  async toggleModule(
    @Body() body: { moduleKey: string; isEnabled: boolean },
  ) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.tenantsService.toggleModule(clinicId, body.moduleKey, body.isEnabled);
  }
}
