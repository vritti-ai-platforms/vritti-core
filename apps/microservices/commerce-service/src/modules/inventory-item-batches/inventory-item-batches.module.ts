import { Module } from '@nestjs/common';
import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { InventoryItemBatchesController } from './inventory-item-batches.controller';

@Module({
  imports: [InventoryItemBatchesDomainModule],
  controllers: [InventoryItemBatchesController],
})
export class InventoryItemBatchesModule {}
