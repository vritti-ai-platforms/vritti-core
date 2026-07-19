import { Module } from '@nestjs/common';
import { InventoryItemSitesDomainRepository } from './repositories/inventory-item-sites.repository';
import { InventoryItemSitesDomainService } from './services/inventory-item-sites.service';

@Module({
  providers: [InventoryItemSitesDomainService, InventoryItemSitesDomainRepository],
  exports: [InventoryItemSitesDomainService, InventoryItemSitesDomainRepository],
})
export class InventoryItemSitesDomainModule {}
