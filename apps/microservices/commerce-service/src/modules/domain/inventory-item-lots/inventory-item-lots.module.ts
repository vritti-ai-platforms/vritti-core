import { Module } from '@nestjs/common';
import { InventoryItemLotsRepository } from './repositories/inventory-item-lots.repository';
import { InventoryItemLotsService } from './services/inventory-item-lots.service';

@Module({
  providers: [InventoryItemLotsService, InventoryItemLotsRepository],
  exports: [InventoryItemLotsService, InventoryItemLotsRepository],
})
export class InventoryItemLotsDomainModule {}
