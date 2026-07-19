import { InventoryItemLocationsDomainModule } from '@domain/inventory-item-locations/inventory-item-locations.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemSerialsDomainModule } from '@domain/inventory-item-serials/inventory-item-serials.module';
import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { Module } from '@nestjs/common';
import { InventoryItemsLedgerModule } from './ledger/inventory-items-ledger.module';
import { InventoryItemsLocationsController } from './locations/inventory-items-locations.controller';
import { InventoryItemsLocationsService } from './locations/services/inventory-items-locations.service';
import { InventoryItemsLotsController } from './lots/inventory-items-lots.controller';
import { InventoryItemsLotsService } from './lots/services/inventory-items-lots.service';
import { InventoryItemsQuantsController } from './quants/inventory-items-quants.controller';
import { InventoryItemsQuantsService } from './quants/services/inventory-items-quants.service';
import { InventoryItemsRootController } from './root/inventory-items-root.controller';
import { SiteInventoryItemsService } from './root/services/inventory-items-root.service';
import { InventoryItemsStocksController } from './stocks/inventory-items-stocks.controller';
import { InventoryItemsStocksService } from './stocks/services/inventory-items-stocks.service';
import { InventoryItemsSupplierItemsController } from './supplier-items/inventory-items-supplier-items.controller';

@Module({
  imports: [
    InventoryItemsDomainModule,
    InventoryItemLocationsDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemSerialsDomainModule,
    InventoryItemSitesDomainModule,
    SupplierItemsDomainModule,
    InventoryItemsLedgerModule,
  ],
  controllers: [
    InventoryItemsRootController,
    InventoryItemsLocationsController,
    InventoryItemsStocksController,
    InventoryItemsSupplierItemsController,
    InventoryItemsLotsController,
    InventoryItemsQuantsController,
  ],
  providers: [
    SiteInventoryItemsService,
    InventoryItemsLocationsService,
    InventoryItemsStocksService,
    InventoryItemsQuantsService,
    InventoryItemsLotsService,
  ],
})
export class SiteInventoryItemsModule {}
