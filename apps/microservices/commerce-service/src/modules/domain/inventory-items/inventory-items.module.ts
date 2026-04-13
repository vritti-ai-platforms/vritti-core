import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { StorageLocationConfigsDomainModule } from '@domain/storage-location-configs/storage-location-configs.module';
import { Module } from '@nestjs/common';
import { InventoryItemsRepository } from './repositories/inventory-items.repository';
import { InventoryItemsService } from './services/inventory-items.service';

@Module({
  imports: [InventoryItemBatchesDomainModule, StorageLocationConfigsDomainModule],
  providers: [InventoryItemsService, InventoryItemsRepository],
  exports: [InventoryItemsService, InventoryItemsRepository],
})
export class InventoryItemsDomainModule {}
