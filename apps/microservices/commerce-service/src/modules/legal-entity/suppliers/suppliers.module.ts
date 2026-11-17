import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { LocationsDomainModule } from '@domain/locations/locations.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierQuotationsDomainModule } from '@domain/supplier-quotations/supplier-quotations.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SupplierEnrollmentQuotationsController } from './enrollments/quotations/supplier-enrollment-quotations.controller';
import { LeSupplierEnrollmentsService } from './enrollments/root/services/supplier-enrollments.service';
import { SupplierEnrollmentsController } from './enrollments/root/supplier-enrollments.controller';
import { SupplierEnrollmentSiteItemsController } from './enrollments/site-items/supplier-enrollment-site-items.controller';
import { SuppliersItemsService } from './items/services/suppliers-items.service';
import { SuppliersItemsController } from './items/suppliers-items.controller';
import { LeSupplierQuotationsService } from './quotations/services/supplier-quotations.service';
import { SupplierQuotationsController } from './quotations/supplier-quotations.controller';
import { SuppliersService } from './root/services/suppliers-root.service';
import { SuppliersRootController } from './root/suppliers-root.controller';
import { LeSupplierSiteItemPricesService } from './site-items/prices/services/supplier-site-item-prices.service';
import { SupplierSiteItemPricesController } from './site-items/prices/supplier-site-item-prices.controller';
import { SupplierSiteItemsController } from './site-items/root/supplier-site-items.controller';

@Module({
  imports: [
    SuppliersDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    SupplierEnrollmentsDomainModule,
    SupplierQuotationsDomainModule,
    InventoryItemsDomainModule,
    InventoryItemMrpsDomainModule,
    LocationsDomainModule,
  ],
  controllers: [
    SuppliersRootController,
    SuppliersItemsController,
    SupplierEnrollmentsController,
    SupplierEnrollmentSiteItemsController,
    SupplierEnrollmentQuotationsController,
    SupplierSiteItemsController,
    SupplierSiteItemPricesController,
    SupplierQuotationsController,
  ],
  providers: [
    SuppliersItemsService,
    SuppliersService,
    LeSupplierQuotationsService,
    LeSupplierEnrollmentsService,
    LeSupplierSiteItemPricesService,
  ],
  exports: [LeSupplierQuotationsService, LeSupplierSiteItemPricesService],
})
export class LeSuppliersModule {}
