import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from './entities/visit.entity';
import { VisitVersion } from './entities/visit-version.entity';
import { VisitMeasurement } from './entities/visit-measurement.entity';
import { VisitDiagnosis } from './entities/visit-diagnosis.entity';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Visit,
      VisitVersion,
      VisitMeasurement,
      VisitDiagnosis,
    ]),
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService, TypeOrmModule],
})
export class RecordsModule {}
