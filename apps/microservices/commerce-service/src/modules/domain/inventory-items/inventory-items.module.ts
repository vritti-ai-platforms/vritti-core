import { Module } from '@nestjs/common';
import { InventoryItemsRepository } from './repositories/inventory-items.repository';
import { InventoryItemsService } from './services/inventory-items.service';

@Module({
  providers: [InventoryItemsService, InventoryItemsRepository],
  exports: [InventoryItemsService, InventoryItemsRepository],
})
export class InventoryItemsDomainModule {}
