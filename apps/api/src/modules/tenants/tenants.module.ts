import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { ClinicBranding } from './entities/clinic-branding.entity';
import { ClinicModule as ClinicModuleEntity } from './entities/clinic-module.entity';
import { TenantSequence } from './entities/tenant-sequence.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinic,
      ClinicBranding,
      ClinicModuleEntity,
      TenantSequence,
    ]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService, TypeOrmModule],
})
export class TenantsModule {}
