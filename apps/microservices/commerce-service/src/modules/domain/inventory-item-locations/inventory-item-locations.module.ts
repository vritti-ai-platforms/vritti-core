import { Module } from '@nestjs/common';
import { InventoryItemLocationsDomainRepository } from './repositories/inventory-item-locations.repository';
import { InventoryItemLocationsDomainService } from './services/inventory-item-locations.service';

@Module({
  providers: [InventoryItemLocationsDomainService, InventoryItemLocationsDomainRepository],
  exports: [InventoryItemLocationsDomainService],
})
export class InventoryItemLocationsDomainModule {}
