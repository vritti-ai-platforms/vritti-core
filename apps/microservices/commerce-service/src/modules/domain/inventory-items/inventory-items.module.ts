import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { StorageLocationConfigsDomainModule } from '@domain/storage-location-configs/storage-location-configs.module';
import { Module } from '@nestjs/common';
import { InventoryItemsRepository } from './repositories/inventory-items.repository';
import { InventoryItemsService } from './services/inventory-items.service';

@Module({
  imports: [InventoryItemQuantsDomainModule, StorageLocationConfigsDomainModule, CategoriesDomainModule],
  providers: [InventoryItemsService, InventoryItemsRepository],
  exports: [InventoryItemsService, InventoryItemsRepository],
})
export class InventoryItemsDomainModule {}
