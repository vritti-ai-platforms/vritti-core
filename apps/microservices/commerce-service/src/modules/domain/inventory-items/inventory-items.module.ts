import { Module } from '@nestjs/common';
import { InventoryItemsDomainRepository } from './repositories/inventory-items.repository';
import { InventoryItemsDomainService } from './services/inventory-items.service';

@Module({
  providers: [InventoryItemsDomainService, InventoryItemsDomainRepository],
  exports: [InventoryItemsDomainService, InventoryItemsDomainRepository],
})
export class InventoryItemsDomainModule {}
