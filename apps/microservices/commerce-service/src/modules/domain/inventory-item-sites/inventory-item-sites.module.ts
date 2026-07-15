import { Module } from '@nestjs/common';
import { InventoryItemSitesRepository } from './repositories/inventory-item-sites.repository';
import { InventoryItemSitesService } from './services/inventory-item-sites.service';

@Module({
  providers: [InventoryItemSitesService, InventoryItemSitesRepository],
  exports: [InventoryItemSitesService, InventoryItemSitesRepository],
})
export class InventoryItemSitesDomainModule {}
