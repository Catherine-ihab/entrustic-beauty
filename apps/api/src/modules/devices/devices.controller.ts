import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { DeviceStatus } from './entities/device.entity';

@Controller('devices')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  @RequirePermissions('services:read')
  async findAll() {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.devicesService.findAll(clinicId);
  }

  @Get(':id')
  @RequirePermissions('services:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.devicesService.findOne(clinicId, id);
  }

  @Post()
  @RequirePermissions('services:manage')
  async create(@Body() dto: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.devicesService.create(clinicId, dto);
  }

  @Patch(':id')
  @RequirePermissions('services:manage')
  async update(@Param('id') id: string, @Body() dto: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.devicesService.update(clinicId, id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('services:manage')
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: DeviceStatus,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.devicesService.setStatus(clinicId, id, status);
  }

  @Delete(':id')
  @RequirePermissions('services:manage')
  async delete(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.devicesService.delete(clinicId, id);
  }
}
