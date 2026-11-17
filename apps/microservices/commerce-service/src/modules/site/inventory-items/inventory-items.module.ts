import { InventoryItemLocationsDomainModule } from '@domain/inventory-item-locations/inventory-item-locations.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemSerialsDomainModule } from '@domain/inventory-item-serials/inventory-item-serials.module';
import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { InventoryItemsLedgerModule } from './ledger/inventory-items-ledger.module';
import { InventoryItemsLocationsController } from './locations/inventory-items-locations.controller';
import { InventoryItemsLocationsService } from './locations/services/inventory-items-locations.service';
import { InventoryItemsLotsController } from './lots/inventory-items-lots.controller';
import { InventoryItemsLotsService } from './lots/services/inventory-items-lots.service';
import { InventoryItemsPricesController } from './prices/inventory-items-prices.controller';
import { InventoryItemsPricesService } from './prices/services/inventory-items-prices.service';
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
    SupplierItemPricesDomainModule,
    UomConversionsDomainModule,
    SuppliersDomainModule,
    InventoryItemMrpsDomainModule,
    InventoryItemsLedgerModule,
  ],
  controllers: [
    InventoryItemsRootController,
    InventoryItemsLocationsController,
    InventoryItemsStocksController,
    InventoryItemsSupplierItemsController,
    InventoryItemsLotsController,
    InventoryItemsQuantsController,
    InventoryItemsPricesController,
  ],
  providers: [
    SiteInventoryItemsService,
    InventoryItemsLocationsService,
    InventoryItemsStocksService,
    InventoryItemsQuantsService,
    InventoryItemsLotsService,
    InventoryItemsPricesService,
  ],
})
export class SiteInventoryItemsModule {}
