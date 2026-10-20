import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { TelemedicineModule } from '../telemedicine/telemedicine.module';
import { MedicalRecordsModule } from '../medical-records/medical-records.module';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { PatientOtp } from './entities/patient-otp.entity';
import { PortalService } from './portal.service';
import { PortalAuthController } from './portal-auth.controller';
import { PortalController } from './portal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientOtp]),
    AuthModule, // provides JwtService (patient tokens are signed here)
    AppointmentsModule, // booking reuses AppointmentsService (conflicts, mapping)
    TelemedicineModule, // room state / signals for the patient side
    MedicalRecordsModule, // vitals trends (MeasurementsService)
  ],
  controllers: [PortalAuthController, PortalController],
  providers: [PortalService, TenantTransactionManager],
  exports: [PortalService],
})
export class PortalModule {}
