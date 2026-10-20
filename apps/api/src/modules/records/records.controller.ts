import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreateVisitDto, AmendVisitDto } from '@clinic/shared-types';

@Controller('visits')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class RecordsController {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @RequirePermissions('records:create')
  async create(@Body() dto: CreateVisitDto, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    const authorId = req.user.sub;
    return this.recordsService.create(clinicId, authorId, dto);
  }

  @Post(':id/amend')
  @RequirePermissions('records:amend')
  async amend(
    @Param('id') id: string,
    @Body() dto: AmendVisitDto,
    @Req() req: any,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    const authorId = req.user.sub;
    return this.recordsService.amend(clinicId, id, authorId, dto);
  }

  @Get('patient/:patientId/last')
  @RequirePermissions('records:read')
  async findLastByPatient(@Param('patientId') patientId: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.recordsService.findLastByPatient(clinicId, patientId);
  }

  @Get('patient/:patientId')
  @RequirePermissions('records:read')
  async findByPatient(@Param('patientId') patientId: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.recordsService.findByPatient(clinicId, patientId);
  }

  @Get(':id')
  @RequirePermissions('records:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.recordsService.findOne(clinicId, id);
  }

  @Get(':id/measurements')
  @RequirePermissions('measurements:read')
  async getMeasurements(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.recordsService.getMeasurements(clinicId, id);
  }

  @Post(':id/measurements')
  @RequirePermissions('measurements:write')
  async addMeasurement(
    @Param('id') id: string,
    @Body() dto: { patientId: string; key: string; value: number; unit: string; notes?: string },
    @Req() req: any,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    const authorId = req.user.sub;
    return this.recordsService.addMeasurement(clinicId, id, dto.patientId, dto, authorId);
  }

  @Get(':id/diagnoses')
  @RequirePermissions('records:read')
  async getDiagnoses(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.recordsService.getDiagnoses(clinicId, id);
  }

  @Post(':id/diagnoses')
  @RequirePermissions('records:create')
  async addDiagnosis(
    @Param('id') id: string,
    @Body() dto: { code?: string; description: string; is_primary?: boolean; notes?: string },
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.recordsService.addDiagnosis(clinicId, id, dto);
  }
}
