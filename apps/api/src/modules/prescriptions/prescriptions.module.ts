import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { Drug } from './entities/drug.entity';
import { DrugInteraction } from './entities/drug-interaction.entity';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionItem } from './entities/prescription-item.entity';
import { DoctorFavoriteDrug } from './entities/doctor-favorite-drug.entity';
import { PrescriptionsService } from './prescriptions.service';
import { DrugsController, PrescriptionsController } from './prescriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Drug,
      DrugInteraction,
      Prescription,
      PrescriptionItem,
      DoctorFavoriteDrug,
    ]),
  ],
  controllers: [DrugsController, PrescriptionsController],
  providers: [PrescriptionsService, TenantTransactionManager],
  exports: [PrescriptionsService, TypeOrmModule],
})
export class PrescriptionsModule {}