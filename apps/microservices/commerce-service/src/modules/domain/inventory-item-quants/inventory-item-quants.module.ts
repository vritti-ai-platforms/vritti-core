import { Module } from '@nestjs/common';
import { InventoryItemCostsDomainRepository } from './repositories/inventory-item-costs.repository';
import { InventoryItemQuantsDomainRepository } from './repositories/inventory-item-quants.repository';
import { InventoryItemQuantsDomainService } from './services/inventory-item-quants.service';

@Module({
  providers: [
    InventoryItemQuantsDomainService,
    InventoryItemQuantsDomainRepository,
    InventoryItemCostsDomainRepository,
  ],
  exports: [InventoryItemQuantsDomainService, InventoryItemQuantsDomainRepository, InventoryItemCostsDomainRepository],
})
export class InventoryItemQuantsDomainModule {}
