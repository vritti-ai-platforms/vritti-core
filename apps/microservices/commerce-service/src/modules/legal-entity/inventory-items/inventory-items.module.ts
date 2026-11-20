import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { LeSuppliersModule } from '@/modules/legal-entity/suppliers/suppliers.module';
import { LeInventoryItemPricesController } from './prices/inventory-item-prices.controller';
import { LeInventoryItemPricesService } from './prices/services/inventory-item-prices.service';
import { LeInventoryItemsController } from './root/inventory-items-root.controller';
import { LeInventoryItemSitesController } from './sites/inventory-item-sites.controller';
import { LeInventoryItemSitesService } from './sites/services/inventory-item-sites.service';
import { LeInventoryItemSuppliersController } from './suppliers/inventory-item-suppliers.controller';
import { LeInventoryItemSuppliersService } from './suppliers/services/inventory-item-suppliers.service';

@Module({
  imports: [
    InventoryItemsDomainModule,
    InventoryItemSitesDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    InventoryItemMrpsDomainModule,
    UomConversionsDomainModule,
    SuppliersDomainModule,
    LeSuppliersModule,
  ],
  controllers: [
    LeInventoryItemsController,
    LeInventoryItemPricesController,
    LeInventoryItemSitesController,
    LeInventoryItemSuppliersController,
  ],
  providers: [LeInventoryItemPricesService, LeInventoryItemSitesService, LeInventoryItemSuppliersService],
})
export class LeInventoryItemsModule {}
