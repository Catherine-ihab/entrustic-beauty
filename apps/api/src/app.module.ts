import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { RecordsModule } from './modules/records/records.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { BeforeAfterModule } from './modules/before-after/before-after.module';
import { AuditModule } from './modules/audit/audit.module';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { TenantTransactionManager } from './common/database/tenant-transaction.manager';
import { validate } from './config/env.validation';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { DevicesModule } from './modules/devices/devices.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LabModule } from './modules/lab/lab.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PortalModule } from './modules/portal/portal.module';
import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.production', '.env.example'],
      validate,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get<string>('DATABASE_USER', 'postgres'),
        password: config.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: config.get<string>('DATABASE_NAME', 'clinic_platform_dev'),
        autoLoadEntities: true,
        // Managed Postgres (Neon, Render, Supabase, RDS) requires TLS; without
        // this the serverless deployment cannot reach the database at all.
        ssl:
          config.get<string>('DATABASE_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        // ConfigService returns raw strings from env — 'false' is truthy, so
        // compare explicitly (schema comes from migrations, not synchronize).
        synchronize: config.get<string>('DATABASE_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    // ─── Rate Limiting ───────────────────────────────────────────────────────
    // Two tiers: prevent short bursts AND sustained abuse
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 10000,  // 10 seconds
        limit: 20,   // max 20 requests per 10s per IP
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 minute
        limit: 100,  // max 100 requests per minute per IP
      },
    ]),
    TenantsModule,
    UsersModule,
    RolesModule,
    AuthModule,
    PatientsModule,
    ServicesModule,
    AppointmentsModule,
    RecordsModule,
    InvoicesModule,
    PlatformAdminModule,
    BeforeAfterModule,
    AuditModule,
    MedicalRecordsModule,
    DevicesModule,
    PrescriptionsModule,
    InventoryModule,
    LabModule,
    NotificationsModule,
    PortalModule,
    TelemedicineModule,
  ],
  providers: [
    TenantTransactionManager,
    // Global rate limiting guard — applies to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolutionMiddleware).forRoutes('*');
  }
}
