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
  Req,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentStatus } from '@clinic/shared-types';

@Controller('appointments')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @RequirePermissions('appointments:create')
  async create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    const userId = req.user.sub;
    return this.appointmentsService.create(clinicId, userId, dto);
  }

  @Get()
  @RequirePermissions('appointments:read')
  async findAll(
    @Query('providerId') providerId?: string,
    @Query('patientId') patientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.appointmentsService.findAll(clinicId, {
      providerId,
      patientId,
      startDate,
      endDate,
      status,
    });
  }

  @Get(':id')
  @RequirePermissions('appointments:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.appointmentsService.findOne(clinicId, id);
  }

  @Patch(':id')
  @RequirePermissions('appointments:update')
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.appointmentsService.update(clinicId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('appointments:delete')
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.appointmentsService.cancel(clinicId, id, reason);
  }
}
