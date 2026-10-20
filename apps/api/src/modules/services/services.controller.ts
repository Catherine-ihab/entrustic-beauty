import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreateClinicServiceDto, UpdateClinicServiceDto } from '@clinic/shared-types';

@Controller('services')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @RequirePermissions('services:manage')
  async create(@Body() dto: CreateClinicServiceDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.servicesService.create(clinicId, dto);
  }

  @Get()
  @RequirePermissions('services:read')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.servicesService.findAll(clinicId, activeOnly === 'true');
  }

  @Get(':id')
  @RequirePermissions('services:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.servicesService.findOne(clinicId, id);
  }

  @Patch(':id')
  @RequirePermissions('services:manage')
  async update(@Param('id') id: string, @Body() dto: UpdateClinicServiceDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.servicesService.update(clinicId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('services:manage')
  async deactivate(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.servicesService.deactivate(clinicId, id);
  }
}
