import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeforeAfterRecord } from './entities/before-after-record.entity';
import { BeforeAfterImage } from './entities/before-after-image.entity';
import { BeforeAfterService } from './before-after.service';
import { BeforeAfterController } from './before-after.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BeforeAfterRecord, BeforeAfterImage]),
    TenantsModule,
  ],
  controllers: [BeforeAfterController],
  providers: [BeforeAfterService],
  exports: [BeforeAfterService, TypeOrmModule],
})
export class BeforeAfterModule {}
