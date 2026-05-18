import { Module } from '@nestjs/common';
import { InventoryItemQuantsRepository } from './repositories/inventory-item-quants.repository';
import { InventoryItemQuantsService } from './services/inventory-item-quants.service';

@Module({
  providers: [InventoryItemQuantsService, InventoryItemQuantsRepository],
  exports: [InventoryItemQuantsService, InventoryItemQuantsRepository],
})
export class InventoryItemQuantsDomainModule {}
