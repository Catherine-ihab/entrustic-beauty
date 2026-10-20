import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { CreateClinicDto, UpdateClinicPlatformDto } from '@clinic/shared-types';
import { IJwtPayload } from '@clinic/shared-types';

@Controller('platform-admin')
@UseGuards(JwtTenantGuard)
export class PlatformAdminController {
  constructor(private readonly adminService: PlatformAdminService) {}

  private assertPlatformAdmin(req: any) {
    const user: IJwtPayload = req.user;
    if (!user || !user.is_platform_admin) {
      throw new ForbiddenException(
        'Access Denied: This area is reserved exclusively for Platform Super Administrators.',
      );
    }
  }

  @Post('clinics')
  async provisionClinic(@Req() req: any, @Body() dto: CreateClinicDto) {
    this.assertPlatformAdmin(req);
    return this.adminService.provisionClinic(dto);
  }

  @Get('clinics')
  async listClinics(@Req() req: any) {
    this.assertPlatformAdmin(req);
    return this.adminService.listAllClinics();
  }

  @Get('clinics/:id')
  async getClinic(@Req() req: any, @Param('id') id: string) {
    this.assertPlatformAdmin(req);
    return this.adminService.getClinicSummary(id);
  }

  @Patch('clinics/:id')
  async updateClinic(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateClinicPlatformDto,
  ) {
    this.assertPlatformAdmin(req);
    return this.adminService.updateClinic(id, dto);
  }
}
