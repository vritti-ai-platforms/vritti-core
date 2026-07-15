import { Module } from '@nestjs/common';
import { InventoryItemMrpsRepository } from './repositories/inventory-item-mrps.repository';
import { InventoryItemMrpsService } from './services/inventory-item-mrps.service';

@Module({
  providers: [InventoryItemMrpsService, InventoryItemMrpsRepository],
  exports: [InventoryItemMrpsService, InventoryItemMrpsRepository],
})
export class InventoryItemMrpsDomainModule {}
