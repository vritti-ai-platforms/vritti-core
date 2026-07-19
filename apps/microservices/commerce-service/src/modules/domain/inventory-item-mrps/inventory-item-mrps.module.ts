import { Module } from '@nestjs/common';
import { InventoryItemMrpsDomainRepository } from './repositories/inventory-item-mrps.repository';
import { InventoryItemMrpsDomainService } from './services/inventory-item-mrps.service';

@Module({
  providers: [InventoryItemMrpsDomainService, InventoryItemMrpsDomainRepository],
  exports: [InventoryItemMrpsDomainService, InventoryItemMrpsDomainRepository],
})
export class InventoryItemMrpsDomainModule {}
