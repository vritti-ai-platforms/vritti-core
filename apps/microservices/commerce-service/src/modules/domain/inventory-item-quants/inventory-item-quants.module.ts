import { Module } from '@nestjs/common';
import { InventoryItemCostsRepository } from './repositories/inventory-item-costs.repository';
import { InventoryItemQuantsRepository } from './repositories/inventory-item-quants.repository';
import { InventoryItemQuantsService } from './services/inventory-item-quants.service';

@Module({
  providers: [InventoryItemQuantsService, InventoryItemQuantsRepository, InventoryItemCostsRepository],
  exports: [InventoryItemQuantsService, InventoryItemQuantsRepository, InventoryItemCostsRepository],
})
export class InventoryItemQuantsDomainModule {}
