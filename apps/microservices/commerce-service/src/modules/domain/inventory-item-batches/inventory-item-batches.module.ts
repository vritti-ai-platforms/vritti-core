import { Module } from '@nestjs/common';
import { InventoryItemBatchesRepository } from './repositories/inventory-item-batches.repository';
import { InventoryItemBatchesService } from './services/inventory-item-batches.service';

@Module({
  providers: [InventoryItemBatchesService, InventoryItemBatchesRepository],
  exports: [InventoryItemBatchesService],
})
export class InventoryItemBatchesDomainModule {}
