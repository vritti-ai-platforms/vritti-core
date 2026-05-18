import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { InventoryItemLocationsDomainModule } from '@domain/inventory-item-locations/inventory-item-locations.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantItemsDomainModule } from '@domain/inventory-item-quant-items/inventory-item-quant-items.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { InventoryItemsLedgerModule } from './ledger/inventory-items-ledger.module';
import { InventoryItemsLocationsController } from './locations/inventory-items-locations.controller';
import { InventoryItemsLocationsService } from './locations/services/inventory-items-locations.service';
import { InventoryItemsLotsController } from './lots/inventory-items-lots.controller';
import { InventoryItemsLotsService } from './lots/services/inventory-items-lots.service';
import { InventoryItemsQuantItemsController } from './quant-items/inventory-items-quant-items.controller';
import { InventoryItemsQuantsController } from './quants/inventory-items-quants.controller';
import { InventoryItemsQuantsService } from './quants/services/inventory-items-quants.service';
import { InventoryItemsRootController } from './root/inventory-items-root.controller';
import { InventoryItemsRootService } from './root/services/inventory-items-root.service';
import { InventoryItemsStocksController } from './stocks/inventory-items-stocks.controller';
import { InventoryItemsStocksService } from './stocks/services/inventory-items-stocks.service';
import { InventoryItemsSupplierItemsController } from './supplier-items/inventory-items-supplier-items.controller';
import { InventoryItemsUomConversionsController } from './uom-conversions/inventory-items-uom-conversions.controller';

@Module({
  imports: [
    InventoryItemsDomainModule,
    InventoryItemUomConversionsDomainModule,
    InventoryItemLocationsDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemQuantItemsDomainModule,
    SupplierItemsDomainModule,
    CategoriesDomainModule,
    UomDomainModule,
    InventoryItemsLedgerModule,
  ],
  controllers: [
    InventoryItemsRootController,
    InventoryItemsUomConversionsController,
    InventoryItemsLocationsController,
    InventoryItemsStocksController,
    InventoryItemsSupplierItemsController,
    InventoryItemsLotsController,
    InventoryItemsQuantsController,
    InventoryItemsQuantItemsController,
  ],
  providers: [
    InventoryItemsRootService,
    InventoryItemsLocationsService,
    InventoryItemsStocksService,
    InventoryItemsQuantsService,
    InventoryItemsLotsService,
  ],
})
export class InventoryItemsModule {}
