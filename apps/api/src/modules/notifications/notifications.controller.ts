import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import {
  INotification,
  INotificationTemplate,
  IReminderSettings,
  RunDueResult,
  SendNotificationDto,
  UpdateNotificationTemplateDto,
  UpdateReminderSettingsDto,
} from '@clinic/shared-types';

@Controller('notifications')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly cls: ClsService,
  ) {}

  private get clinicId(): string {
    return this.cls.get<string>(TENANT_ID_KEY);
  }

  // ─── Outbox ───────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('notifications:read')
  async list(
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('q') q?: string,
  ): Promise<INotification[]> {
    return this.notificationsService.listNotifications(this.clinicId, status, channel, q);
  }

  @Post()
  @RequirePermissions('notifications:manage')
  async send(@Body() dto: SendNotificationDto): Promise<INotification> {
    return this.notificationsService.manualSend(this.clinicId, dto);
  }

  @Post('run-due')
  @RequirePermissions('notifications:manage')
  async runDue(): Promise<RunDueResult> {
    return this.notificationsService.runDue(this.clinicId);
  }

  @Post(':id/retry')
  @RequirePermissions('notifications:manage')
  async retry(@Param('id') id: string): Promise<INotification> {
    return this.notificationsService.retry(this.clinicId, id);
  }

  @Post(':id/cancel')
  @RequirePermissions('notifications:manage')
  async cancel(@Param('id') id: string): Promise<INotification> {
    return this.notificationsService.cancel(this.clinicId, id);
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  @Get('templates')
  @RequirePermissions('notifications:read')
  async listTemplates(@Query('q') q?: string): Promise<INotificationTemplate[]> {
    return this.notificationsService.listTemplates(this.clinicId, q);
  }

  @Patch('templates/:id')
  @RequirePermissions('notifications:manage')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ): Promise<INotificationTemplate> {
    return this.notificationsService.updateTemplate(this.clinicId, id, dto);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  @Get('settings')
  @RequirePermissions('notifications:read')
  async getSettings(): Promise<IReminderSettings> {
    return this.notificationsService.getSettings(this.clinicId);
  }

  @Put('settings')
  @RequirePermissions('notifications:manage')
  async updateSettings(@Body() dto: UpdateReminderSettingsDto): Promise<IReminderSettings> {
    return this.notificationsService.updateSettings(this.clinicId, dto);
  }

  // ─── Single outbox row (static routes above must win) ─────────────────────

  @Get(':id')
  @RequirePermissions('notifications:read')
  async getOne(@Param('id') id: string): Promise<INotification> {
    return this.notificationsService.getNotification(this.clinicId, id);
  }
}
