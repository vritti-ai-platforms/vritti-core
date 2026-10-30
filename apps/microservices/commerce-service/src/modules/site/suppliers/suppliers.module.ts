import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierSitesDomainModule } from '@domain/supplier-sites/supplier-sites.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SiteSupplierItemPricesController } from './item-prices/site-supplier-item-prices.controller';
import { SiteSupplierItemsController } from './items/site-supplier-items.controller';
import { SiteSuppliersService } from './root/services/site-suppliers.service';
import { SiteSuppliersController } from './root/site-suppliers.controller';

@Module({
  imports: [
    SupplierSitesDomainModule,
    SuppliersDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
  ],
  controllers: [SiteSuppliersController, SiteSupplierItemsController, SiteSupplierItemPricesController],
  providers: [SiteSuppliersService],
})
export class SiteSuppliersModule {}
