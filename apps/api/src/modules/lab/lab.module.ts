import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { LabTest } from './entities/lab-test.entity';
import { LabRequest } from './entities/lab-request.entity';
import { LabRequestItem } from './entities/lab-request-item.entity';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LabTest, LabRequest, LabRequestItem])],
  controllers: [LabController],
  providers: [LabService, TenantTransactionManager],
  exports: [LabService, TypeOrmModule],
})
export class LabModule {}