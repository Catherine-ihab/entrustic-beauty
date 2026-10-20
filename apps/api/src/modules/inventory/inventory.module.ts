import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantTransactionManager } from '../../common/database/tenant-transaction.manager';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, InventoryBatch, InventoryMovement])],
  controllers: [InventoryController],
  providers: [InventoryService, TenantTransactionManager],
  exports: [InventoryService, TypeOrmModule],
})
export class InventoryModule {}