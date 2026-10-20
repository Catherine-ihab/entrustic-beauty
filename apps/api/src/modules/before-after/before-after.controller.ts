import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BeforeAfterService } from './before-after.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ModuleEnabledGuard, RequireModule } from '../../common/guards/module-enabled.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreateBeforeAfterRecordDto } from '@clinic/shared-types';

@Controller('before-after')
@UseGuards(JwtTenantGuard, PermissionsGuard, ModuleEnabledGuard)
@RequireModule('before_after')
export class BeforeAfterController {
  constructor(
    private readonly baService: BeforeAfterService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @RequirePermissions('before_after:create')
  async create(@Body() dto: CreateBeforeAfterRecordDto, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    const userId = req.user.sub;
    return this.baService.create(clinicId, userId, dto);
  }

  @Get('patient/:patientId')
  @RequirePermissions('before_after:read')
  async findByPatient(@Param('patientId') patientId: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.baService.findByPatient(clinicId, patientId);
  }

  @Get(':id')
  @RequirePermissions('before_after:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.baService.findOne(clinicId, id);
  }
}
