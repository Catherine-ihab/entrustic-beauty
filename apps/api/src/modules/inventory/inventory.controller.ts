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
import { InventoryService } from './inventory.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import {
  IInventoryItem,
  IInventoryBatch,
  IInventoryAlerts,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  ReceiveBatchDto,
  ConsumeStockDto,
} from '@clinic/shared-types';

@Controller('inventory')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly cls: ClsService,
  ) {}

  private get clinicId(): string {
    return this.cls.get<string>(TENANT_ID_KEY);
  }

  @Get()
  @RequirePermissions('inventory:read')
  async findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
  ): Promise<IInventoryItem[]> {
    return this.inventoryService.findAll(this.clinicId, q, category);
  }

  @Get('alerts')
  @RequirePermissions('inventory:read')
  async getAlerts(): Promise<IInventoryAlerts> {
    return this.inventoryService.getAlerts(this.clinicId);
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(this.clinicId, id);
  }

  @Post()
  @RequirePermissions('inventory:manage')
  async create(@Body() dto: CreateInventoryItemDto): Promise<IInventoryItem> {
    return this.inventoryService.create(this.clinicId, dto);
  }

  @Patch(':id')
  @RequirePermissions('inventory:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<IInventoryItem> {
    return this.inventoryService.update(this.clinicId, id, dto);
  }

  @Post(':id/batches')
  @RequirePermissions('inventory:manage')
  async receiveStock(
    @Param('id') id: string,
    @Body() dto: ReceiveBatchDto,
    @Request() req: any,
  ): Promise<IInventoryBatch> {
    return this.inventoryService.receiveStock(this.clinicId, id, dto, req.user?.sub ?? null);
  }

  @Post(':id/consume')
  @RequirePermissions('inventory:manage')
  async consumeStock(
    @Param('id') id: string,
    @Body() dto: ConsumeStockDto,
    @Request() req: any,
  ) {
    return this.inventoryService.consumeStock(
      this.clinicId,
      id,
      dto.quantity,
      dto.reason ?? null,
      req.user?.sub ?? null,
    );
  }
}