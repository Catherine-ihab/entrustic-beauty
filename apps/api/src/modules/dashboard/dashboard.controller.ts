import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { DashboardService, DashboardSummary } from './dashboard.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';

@Controller('dashboard')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly cls: ClsService,
  ) {}

  @Get('summary')
  @RequirePermissions('patients:read')
  async summary(): Promise<DashboardSummary> {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.dashboardService.getSummary(clinicId);
  }
}
