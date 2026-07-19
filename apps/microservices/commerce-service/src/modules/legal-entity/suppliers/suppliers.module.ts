import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierSitesDomainModule } from '@domain/supplier-sites/supplier-sites.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SupplierItemPricesController } from './item-prices/supplier-item-prices.controller';
import { SupplierItemSitesController } from './item-sites/supplier-item-sites.controller';
import { SuppliersItemsService } from './items/services/suppliers-items.service';
import { SuppliersItemsController } from './items/suppliers-items.controller';
import { SuppliersService } from './root/services/suppliers-root.service';
import { SuppliersRootController } from './root/suppliers-root.controller';
import { SupplierSitesController } from './sites/supplier-sites.controller';

@Module({
  imports: [SuppliersDomainModule, SupplierItemsDomainModule, SupplierSitesDomainModule, InventoryItemsDomainModule],
  controllers: [
    SuppliersRootController,
    SuppliersItemsController,
    SupplierSitesController,
    SupplierItemPricesController,
    SupplierItemSitesController,
  ],
  providers: [SuppliersItemsService, SuppliersService],
})
export class LeSuppliersModule {}
