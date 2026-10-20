import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { TenantSequence } from '../tenants/entities/tenant-sequence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, TenantSequence])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService, TypeOrmModule],
})
export class PatientsModule {}
