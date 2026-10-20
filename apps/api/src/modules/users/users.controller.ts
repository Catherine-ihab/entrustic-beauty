import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../../common/middleware/tenant-resolution.middleware';
import { UserStatus } from '@clinic/shared-types';
import { UnauthorizedException } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtTenantGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cls: ClsService,
  ) {}

  @Get('staff')
  @RequirePermissions('staff:read')
  async getStaff() {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.usersService.findAllByClinic(clinicId);
  }

  @Post('staff')
  @RequirePermissions('staff:manage')
  async createStaff(
    @Body()
    dto: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleIds: string[];
    },
  ) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.usersService.createStaff(clinicId, dto);
  }

  /**
   * Authenticated user changes their own password.
   * Requires being signed in; current password must be correct.
   */
  @Post('me/password/change')
  async changeMyPassword(
    @Body()
    dto: {
      currentPassword: string;
      newPassword: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    if (!userId) throw new UnauthorizedException('User context not found');
    await this.usersService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true };
  }

  @Patch('staff/:id/status')
  @RequirePermissions('staff:manage')
  async updateStatus(
    @Param('id') userId: string,
    @Body('status') status: UserStatus,
  ) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.usersService.updateStaffStatus(clinicId, userId, status);
  }

  @Patch('staff/:id/roles')
  @RequirePermissions('staff:manage')
  async assignRoles(
    @Param('id') userId: string,
    @Body('roleIds') roleIds: string[],
  ) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    return this.usersService.assignRoles(clinicId, userId, roleIds);
  }

  @Delete('staff/:id')
  @RequirePermissions('staff:manage')
  async removeStaff(@Param('id') userId: string, @Req() req: any) {
    const clinicId = this.cls.get(TENANT_ID_KEY);
    const requesterId = req.user?.sub ?? req.user?.id;
    return this.usersService.removeStaff(clinicId, userId, requesterId);
  }
}
