import { Module } from '@nestjs/common';
import { InventoryItemQuantItemsRepository } from './repositories/inventory-item-quant-items.repository';
import { InventoryItemQuantItemsService } from './services/inventory-item-quant-items.service';

@Module({
  providers: [InventoryItemQuantItemsService, InventoryItemQuantItemsRepository],
  exports: [InventoryItemQuantItemsService, InventoryItemQuantItemsRepository],
})
export class InventoryItemQuantItemsDomainModule {}
