import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from '../tenants/entities/clinic.entity';
import { ClinicBranding } from '../tenants/entities/clinic-branding.entity';
import { ClinicModule as ClinicModuleEntity } from '../tenants/entities/clinic-module.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../roles/entities/permission.entity';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminController } from './platform-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinic,
      ClinicBranding,
      ClinicModuleEntity,
      User,
      Role,
      Permission,
    ]),
  ],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService],
  exports: [PlatformAdminService],
})
export class PlatformAdminModule {}
