import { Module } from '@nestjs/common';
import { InventoryItemSiteStockLevelsDomainRepository } from './repositories/inventory-item-site-stock-levels.repository';
import { InventoryItemSiteStockLevelsDomainService } from './services/inventory-item-site-stock-levels.service';

@Module({
  providers: [InventoryItemSiteStockLevelsDomainService, InventoryItemSiteStockLevelsDomainRepository],
  exports: [InventoryItemSiteStockLevelsDomainService, InventoryItemSiteStockLevelsDomainRepository],
})
export class InventoryItemSiteStockLevelsDomainModule {}
