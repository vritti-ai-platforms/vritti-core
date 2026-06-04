import { Module } from '@nestjs/common';
import { InventoryItemLocationsRepository } from './repositories/inventory-item-locations.repository';
import { InventoryItemLocationsService } from './services/inventory-item-locations.service';

@Module({
  providers: [InventoryItemLocationsService, InventoryItemLocationsRepository],
  exports: [InventoryItemLocationsService],
})
export class InventoryItemLocationsDomainModule {}
