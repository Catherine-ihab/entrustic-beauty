import { Module } from '@nestjs/common';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { TelemedicineService } from './telemedicine.service';
import { TelemedicineController } from './telemedicine.controller';

@Module({
  controllers: [TelemedicineController],
  providers: [TelemedicineService, TenantTransactionManager],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
