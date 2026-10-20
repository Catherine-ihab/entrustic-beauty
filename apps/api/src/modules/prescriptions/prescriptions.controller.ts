import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreatePrescriptionDto } from '@clinic/shared-types';

// ─── Drug catalog ───────────────────────────────────────────────────────────
@Controller('drugs')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class DrugsController {
  constructor(private readonly prescriptionsService: PrescriptionsService, private readonly cls: ClsService) {}

  @Get()
  @RequirePermissions('drugs:read')
  async list(@Query('q') q?: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.listDrugs(clinicId, q);
  }

  @Get(':id/interactions')
  @RequirePermissions('drugs:read')
  async interactions(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.getInteractions(clinicId, id);
  }

  @Post()
  @RequirePermissions('drugs:manage')
  async create(@Body() dto: Record<string, any>) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.createDrug(clinicId, dto as any);
  }
}

// ─── Prescriptions ──────────────────────────────────────────────────────────
@Controller('prescriptions')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService, private readonly cls: ClsService) {}

  @Get('favorites')
  @RequirePermissions('drugs:read')
  async favorites(@Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.getFavorites(clinicId, req.user.sub);
  }

  @Get()
  @RequirePermissions('prescriptions:read')
  async list(@Query('patientId') patientId?: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.listPrescriptions(clinicId, patientId || undefined);
  }

  @Post('check')
  @RequirePermissions('prescriptions:write')
  async check(@Body() dto: CreatePrescriptionDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.checkSafety(clinicId, dto.patientId ?? null, dto.items);
  }

  @Post()
  @RequirePermissions('prescriptions:write')
  async create(@Body() dto: CreatePrescriptionDto, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.prescriptionsService.createPrescription(clinicId, req.user.sub, dto);
  }
}