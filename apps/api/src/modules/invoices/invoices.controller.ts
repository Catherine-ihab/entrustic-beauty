import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TenantsService } from '../tenants/tenants.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreateInvoiceDto, RecordPaymentDto } from '@clinic/shared-types';

@Controller('invoices')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly tenantsService: TenantsService,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @RequirePermissions('invoices:create')
  async create(@Body() dto: CreateInvoiceDto) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    const clinic = await this.tenantsService.findById(clinicId);
    const currency = clinic?.currency || 'USD';
    return this.invoicesService.create(clinicId, currency, dto);
  }

  @Post(':id/payments')
  @RequirePermissions('invoices:payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.invoicesService.recordPayment(clinicId, id, dto);
  }

  @Get()
  @RequirePermissions('invoices:read')
  async findAll(@Query('patientId') patientId?: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.invoicesService.findAll(clinicId, patientId);
  }

  @Get(':id')
  @RequirePermissions('invoices:read')
  async findOne(@Param('id') id: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.invoicesService.findOne(clinicId, id);
  }
}
