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
import { PatientsService } from './patients.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreatePatientDto, UpdatePatientDto } from '@clinic/shared-types';

@Controller('patients')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @RequirePermissions('patients:create')
  async create(@Body() dto: CreatePatientDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.patientsService.create(clinicId, dto);
  }

  @Get()
  @RequirePermissions('patients:read')
  async findAll(@Query() query: { page?: number; limit?: number; search?: string }) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.patientsService.findAll(clinicId, query);
  }

  @Get(':id')
  @RequirePermissions('patients:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.patientsService.findOne(clinicId, id);
  }

  @Patch(':id')
  @RequirePermissions('patients:update')
  async update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.patientsService.update(clinicId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('patients:delete')
  async remove(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.patientsService.remove(clinicId, id);
  }
}
