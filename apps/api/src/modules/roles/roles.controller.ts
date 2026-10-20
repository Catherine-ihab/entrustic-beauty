import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';

@Controller('roles')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  @RequirePermissions('roles:read')
  async findAll() {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.rolesService.findAll(clinicId);
  }

  @Get('permissions/all')
  @RequirePermissions('roles:read')
  async getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.rolesService.findOne(clinicId, id);
  }

  @Post()
  @RequirePermissions('roles:manage')
  async create(@Body() dto: CreateRoleDto) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.rolesService.create(clinicId, dto);
  }

  @Put(':id')
  @RequirePermissions('roles:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.rolesService.update(clinicId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('roles:manage')
  async delete(@Param('id') id: string) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.rolesService.delete(clinicId, id);
  }
}
