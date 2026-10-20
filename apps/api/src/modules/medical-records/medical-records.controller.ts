import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, Query as NestQuery } from '@nestjs/common';
import { Request } from 'express';
import { SnapshotService } from './snapshot.service';
import { ConditionsService } from './conditions.service';
import { AllergiesService } from './allergies.service';
import { MedicationsService } from './medications.service';
import { FamilyHistoryService } from './family-history.service';
import { PatientFilesService } from './patient-files.service';
import { ConsentService } from './consent.service';
import { MeasurementsService } from './measurements.service';
import { TimelineService } from './timeline.service';
import { RequirePermissions } from '../../common/guards/permissions.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';

@Controller('patients/:patientId')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class MedicalRecordsController {
  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly conditionsService: ConditionsService,
    private readonly allergiesService: AllergiesService,
    private readonly medicationsService: MedicationsService,
    private readonly familyHistoryService: FamilyHistoryService,
    private readonly patientFilesService: PatientFilesService,
    private readonly consentService: ConsentService,
    private readonly measurementsService: MeasurementsService,
    private readonly timelineService: TimelineService,
    private readonly cls: ClsService,
  ) {}

  @Get('snapshot')
  @RequirePermissions('patients:read')
  getSnapshot(@Param('patientId') patientId: string) {
    return this.snapshotService.getSnapshot(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Get('conditions')
  @RequirePermissions('conditions:read')
  getConditions(@Param('patientId') patientId: string) {
    return this.conditionsService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Post('conditions')
  @RequirePermissions('conditions:write')
  createCondition(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.conditionsService.create(this.cls.get<string>(TENANT_ID_KEY), patientId, dto, (req.user as any)?.sub);
  }

  @Patch('conditions/:id')
  @RequirePermissions('conditions:write')
  updateCondition(@Param('patientId') patientId: string, @Param('id') id: string, @Body() dto: any) {
    return this.conditionsService.update(this.cls.get<string>(TENANT_ID_KEY), patientId, id, dto);
  }

  @Get('allergies')
  @RequirePermissions('allergies:read')
  getAllergies(@Param('patientId') patientId: string) {
    return this.allergiesService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Post('allergies')
  @RequirePermissions('allergies:write')
  createAllergy(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.allergiesService.create(this.cls.get<string>(TENANT_ID_KEY), patientId, dto, (req.user as any)?.sub);
  }

  @Patch('allergies/:id')
  @RequirePermissions('allergies:write')
  updateAllergy(@Param('patientId') patientId: string, @Param('id') id: string, @Body() dto: any) {
    return this.allergiesService.update(this.cls.get<string>(TENANT_ID_KEY), patientId, id, dto);
  }

  @Get('medications')
  @RequirePermissions('medications:read')
  getMedications(@Param('patientId') patientId: string) {
    return this.medicationsService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Post('medications')
  @RequirePermissions('medications:write')
  createMedication(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.medicationsService.create(this.cls.get<string>(TENANT_ID_KEY), patientId, dto, (req.user as any)?.sub);
  }

  @Patch('medications/:id')
  @RequirePermissions('medications:write')
  updateMedication(@Param('patientId') patientId: string, @Param('id') id: string, @Body() dto: any) {
    return this.medicationsService.update(this.cls.get<string>(TENANT_ID_KEY), patientId, id, dto);
  }

  @Get('family-history')
  @RequirePermissions('family_history:read')
  getFamilyHistory(@Param('patientId') patientId: string) {
    return this.familyHistoryService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Post('family-history')
  @RequirePermissions('family_history:write')
  createFamilyHistory(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.familyHistoryService.create(this.cls.get<string>(TENANT_ID_KEY), patientId, dto, (req.user as any)?.sub);
  }

  @Get('files')
  @RequirePermissions('files:read')
  getFiles(@Param('patientId') patientId: string, @NestQuery() query: any) {
    return this.patientFilesService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId, query);
  }

  @Post('files')
  @RequirePermissions('files:upload')
  createFile(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.patientFilesService.create(this.cls.get<string>(TENANT_ID_KEY), patientId, dto, (req.user as any)?.sub);
  }

  @Patch('files/:id/archive')
  @RequirePermissions('files:archive')
  archiveFile(@Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientFilesService.archive(this.cls.get<string>(TENANT_ID_KEY), patientId, id);
  }

  @Get('files/:id/url')
  @RequirePermissions('files:read')
  getFileUrl(@Param('patientId') patientId: string, @Param('id') id: string) {
    return this.patientFilesService.getDownloadUrl(this.cls.get<string>(TENANT_ID_KEY), patientId, id);
  }

  @Get('consents')
  @RequirePermissions('consent:read')
  getConsents(@Param('patientId') patientId: string) {
    return this.consentService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Post('consents')
  @RequirePermissions('consent:write')
  createConsent(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.consentService.create(this.cls.get<string>(TENANT_ID_KEY), patientId, dto, (req.user as any)?.sub);
  }

  @Get('measurements')
  @RequirePermissions('measurements:read')
  getMeasurements(@Param('patientId') patientId: string) {
    return this.measurementsService.findAll(this.cls.get<string>(TENANT_ID_KEY), patientId);
  }

  @Get('measurements/trends')
  @RequirePermissions('measurements:read')
  getMeasurementTrends(
    @Param('patientId') patientId: string,
    @NestQuery() query: { days?: string; from?: string; to?: string },
  ) {
    return this.measurementsService.trends(this.cls.get<string>(TENANT_ID_KEY), patientId, query);
  }

  @Post('measurements')
  @RequirePermissions('measurements:write')
  recordMeasurement(@Param('patientId') patientId: string, @Body() dto: any, @Req() req: Request) {
    return this.measurementsService.create(
      this.cls.get<string>(TENANT_ID_KEY),
      patientId,
      dto,
      (req.user as any)?.sub,
    );
  }

  @Get('timeline')
  @RequirePermissions('records:read')
  getTimeline(
    @Param('patientId') patientId: string,
    @NestQuery('type') type?: string,
  ) {
    return this.timelineService.getPatientTimeline(
      this.cls.get<string>(TENANT_ID_KEY),
      patientId,
      type,
    );
  }
}
