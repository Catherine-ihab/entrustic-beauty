import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationTemplate])],
  controllers: [NotificationsController],
  providers: [NotificationsService, TenantTransactionManager],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
