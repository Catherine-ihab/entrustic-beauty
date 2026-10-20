import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LabService } from './lab.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import {
  ILabTest,
  ILabRequest,
  ILabRequestSummary,
  CreateLabTestDto,
  UpdateLabTestDto,
  CreateLabRequestDto,
  UpdateLabRequestDto,
  UpdateLabRequestItemDto,
} from '@clinic/shared-types';

@Controller('lab')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class LabController {
  constructor(
    private readonly labService: LabService,
    private readonly cls: ClsService,
  ) {}

  private get clinicId(): string {
    return this.cls.get<string>(TENANT_ID_KEY);
  }

  // ─── Test catalog ──────────────────────────────────────────────────────────

  @Get('tests')
  @RequirePermissions('lab:read')
  async listTests(@Query('q') q?: string): Promise<ILabTest[]> {
    return this.labService.listTests(this.clinicId, q);
  }

  @Post('tests')
  @RequirePermissions('lab:manage')
  async createTest(@Body() dto: CreateLabTestDto): Promise<ILabTest> {
    return this.labService.createTest(this.clinicId, dto);
  }

  @Patch('tests/:id')
  @RequirePermissions('lab:manage')
  async updateTest(
    @Param('id') id: string,
    @Body() dto: UpdateLabTestDto,
  ): Promise<ILabTest> {
    return this.labService.updateTest(this.clinicId, id, dto);
  }

  // ─── Requests ──────────────────────────────────────────────────────────────

  @Get('requests')
  @RequirePermissions('lab:read')
  async listRequests(
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('q') q?: string,
  ): Promise<ILabRequestSummary[]> {
    return this.labService.listRequests(this.clinicId, status, patientId, q);
  }

  @Get('requests/:id')
  @RequirePermissions('lab:read')
  async getRequest(@Param('id') id: string): Promise<ILabRequest> {
    return this.labService.getRequest(this.clinicId, id);
  }

  @Post('requests')
  @RequirePermissions('lab:manage')
  async createRequest(
    @Body() dto: CreateLabRequestDto,
    @Request() req: any,
  ): Promise<ILabRequest> {
    return this.labService.createRequest(this.clinicId, dto, req.user?.sub ?? null);
  }

  @Patch('requests/:id')
  @RequirePermissions('lab:manage')
  async updateRequest(
    @Param('id') id: string,
    @Body() dto: UpdateLabRequestDto,
    @Request() req: any,
  ): Promise<ILabRequest> {
    return this.labService.updateRequest(this.clinicId, id, dto, req.user?.sub ?? null);
  }

  @Patch('requests/:id/items/:itemId')
  @RequirePermissions('lab:manage')
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateLabRequestItemDto,
    @Request() req: any,
  ): Promise<ILabRequest> {
    return this.labService.updateItem(this.clinicId, id, itemId, dto, req.user?.sub ?? null);
  }
}