import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { IAuditLogEntry } from '@clinic/shared-types';

@Controller('audit')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  @RequirePermissions('audit:read')
  async getAuditLogs(): Promise<IAuditLogEntry[]> {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.auditService.findAll(clinicId);
  }
}
