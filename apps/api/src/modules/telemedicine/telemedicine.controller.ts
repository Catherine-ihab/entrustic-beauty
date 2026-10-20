import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TelemedicineService, TelemedViewer } from './telemedicine.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { PostSignalDto } from '@clinic/shared-types';

/**
 * Staff-facing telemedicine room API. Permissions reuse the appointments
 * resource (rooms ARE appointments) — no new permission keys required.
 */
@Controller('telemedicine')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class TelemedicineController {
  constructor(
    private readonly telemedicineService: TelemedicineService,
    private readonly cls: ClsService,
  ) {}

  private viewer(req: any): TelemedViewer {
    return { type: 'provider', id: req.user.sub };
  }

  @Get('rooms')
  @RequirePermissions('appointments:read')
  async listRooms(@Query('date') date?: string) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.telemedicineService.listRooms(clinicId, date);
  }

  @Get('rooms/:appointmentId')
  @RequirePermissions('appointments:read')
  async getRoomState(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.telemedicineService.getRoomState(clinicId, appointmentId, this.viewer(req));
  }

  @Post('rooms/:appointmentId/join')
  @RequirePermissions('appointments:update')
  async join(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.telemedicineService.join(clinicId, appointmentId, this.viewer(req));
  }

  @Post('rooms/:appointmentId/leave')
  @RequirePermissions('appointments:update')
  async leave(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.telemedicineService.leave(clinicId, appointmentId, this.viewer(req));
  }

  @Get('rooms/:appointmentId/signals')
  @RequirePermissions('appointments:read')
  async listSignals(
    @Param('appointmentId') appointmentId: string,
    @Query('after') after?: string,
    @Req() req?: any,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.telemedicineService.listSignals(
      clinicId,
      appointmentId,
      this.viewer(req),
      Number(after ?? 0),
    );
  }

  @Post('rooms/:appointmentId/signals')
  @RequirePermissions('appointments:update')
  async postSignal(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: PostSignalDto,
    @Req() req: any,
  ) {
    const clinicId = this.cls.get<string>(TENANT_ID_KEY);
    return this.telemedicineService.postSignal(clinicId, appointmentId, this.viewer(req), dto);
  }
}
