import { Module } from '@nestjs/common';
import { InventoryItemLotsDomainRepository } from './repositories/inventory-item-lots.repository';
import { InventoryItemLotsDomainService } from './services/inventory-item-lots.service';

@Module({
  providers: [InventoryItemLotsDomainService, InventoryItemLotsDomainRepository],
  exports: [InventoryItemLotsDomainService, InventoryItemLotsDomainRepository],
})
export class InventoryItemLotsDomainModule {}
