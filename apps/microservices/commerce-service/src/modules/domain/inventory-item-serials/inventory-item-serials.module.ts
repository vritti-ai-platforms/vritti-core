import { Module } from '@nestjs/common';
import { InventoryItemSerialsRepository } from './repositories/inventory-item-serials.repository';
import { InventoryItemSerialsService } from './services/inventory-item-serials.service';

@Module({
  providers: [InventoryItemSerialsService, InventoryItemSerialsRepository],
  exports: [InventoryItemSerialsService, InventoryItemSerialsRepository],
})
export class InventoryItemSerialsDomainModule {}
