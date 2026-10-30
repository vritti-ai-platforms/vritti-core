import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierQuotationsDomainModule } from '@domain/supplier-quotations/supplier-quotations.module';
import { SupplierSitesDomainModule } from '@domain/supplier-sites/supplier-sites.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SupplierItemPricesController } from './item-prices/supplier-item-prices.controller';
import { SupplierItemSitesController } from './item-sites/supplier-item-sites.controller';
import { SuppliersItemsService } from './items/services/suppliers-items.service';
import { SuppliersItemsController } from './items/suppliers-items.controller';
import { LeSupplierQuotationsService } from './quotations/services/supplier-quotations.service';
import { SupplierQuotationsController } from './quotations/supplier-quotations.controller';
import { SuppliersService } from './root/services/suppliers-root.service';
import { SuppliersRootController } from './root/suppliers-root.controller';
import { SupplierSitesController } from './sites/supplier-sites.controller';

@Module({
  imports: [
    SuppliersDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    SupplierSitesDomainModule,
    SupplierQuotationsDomainModule,
    InventoryItemsDomainModule,
    InventoryItemMrpsDomainModule,
  ],
  controllers: [
    SuppliersRootController,
    SuppliersItemsController,
    SupplierSitesController,
    SupplierItemPricesController,
    SupplierItemSitesController,
    SupplierQuotationsController,
  ],
  providers: [SuppliersItemsService, SuppliersService, LeSupplierQuotationsService],
})
export class LeSuppliersModule {}
