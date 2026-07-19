import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierSitesDomainModule } from '@domain/supplier-sites/supplier-sites.module';
import { Module } from '@nestjs/common';
import { SiteSupplierItemsController } from './items/site-supplier-items.controller';
import { SiteSuppliersService } from './root/services/site-suppliers.service';
import { SiteSuppliersController } from './root/site-suppliers.controller';

@Module({
  imports: [SupplierSitesDomainModule, SupplierItemsDomainModule],
  controllers: [SiteSuppliersController, SiteSupplierItemsController],
  providers: [SiteSuppliersService],
})
export class SiteSuppliersModule {}
