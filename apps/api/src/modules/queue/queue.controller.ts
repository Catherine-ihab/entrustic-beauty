import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueEntryDto } from './dto/update-queue-entry.dto';

@Controller('queue')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  async findAll() {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.queueService.findAll(clinicId);
  }

  @Post()
  async create(@Body() dto: CreateQueueEntryDto) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.queueService.create(clinicId, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQueueEntryDto) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.queueService.update(clinicId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    await this.queueService.remove(clinicId, id);
    return { success: true };
  }

  @Delete()
  async clear() {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    await this.queueService.clear(clinicId);
    return { success: true };
  }
}
