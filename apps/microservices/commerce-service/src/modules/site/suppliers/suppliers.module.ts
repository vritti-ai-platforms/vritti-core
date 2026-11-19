import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { PaymentTermRulesDomainModule } from '@domain/payment-term-rules/payment-term-rules.module';
import { PaymentTermsDomainModule } from '@domain/payment-terms/payment-terms.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { PurchasesDomainModule } from '@domain/purchases/purchases.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { SupplierInvoicesDomainModule } from '@domain/supplier-invoices/supplier-invoices.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierQuotationsDomainModule } from '@domain/supplier-quotations/supplier-quotations.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { LeSuppliersModule } from '@/modules/legal-entity/suppliers/suppliers.module';
import { SitePurchaseProgressModule } from '@/modules/site/purchase-progress/purchase-progress.module';
import { SitePurchasingRulesModule } from '@/modules/site/purchasing-rules/purchasing-rules.module';
import { SiteSupplierInvoiceHoldsController } from './invoices/holds/site-supplier-invoice-holds.controller';
import { SupplierInvoiceLinesService } from './invoices/lines/services/supplier-invoice-lines.service';
import { SiteSupplierInvoiceLinesController } from './invoices/lines/site-supplier-invoice-lines.controller';
import { SupplierInvoiceRecostingService } from './invoices/root/services/supplier-invoice-recosting.service';
import { SupplierInvoicesService } from './invoices/root/services/supplier-invoices.service';
import { SiteSupplierInvoicesController } from './invoices/root/site-supplier-invoices.controller';
import { SiteSupplierQuotationsService } from './quotations/services/site-supplier-quotations.service';
import { SiteSupplierQuotationsController } from './quotations/site-supplier-quotations.controller';
import { SiteSuppliersService } from './root/services/site-suppliers.service';
import { SiteSuppliersController } from './root/site-suppliers.controller';
import { SiteSupplierSiteItemPricesService } from './site-items/prices/services/site-supplier-site-item-prices.service';
import { SiteSupplierSiteItemPricesController } from './site-items/prices/site-supplier-site-item-prices.controller';
import { SiteSupplierSiteItemsController } from './site-items/root/site-supplier-site-items.controller';

@Module({
  imports: [
    SuppliersDomainModule,
    SupplierEnrollmentsDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    SupplierQuotationsDomainModule,
    SupplierInvoicesDomainModule,
    PaymentTermsDomainModule,
    PaymentTermRulesDomainModule,
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    InventoryItemQuantsDomainModule,
    PurchasesDomainModule,
    UomConversionsDomainModule,
    SitePurchasingRulesModule,
    SitePurchaseProgressModule,
    LeSuppliersModule,
  ],
  controllers: [
    SiteSuppliersController,
    SiteSupplierSiteItemsController,
    SiteSupplierSiteItemPricesController,
    SiteSupplierQuotationsController,
    SiteSupplierInvoicesController,
    SiteSupplierInvoiceLinesController,
    SiteSupplierInvoiceHoldsController,
  ],
  providers: [
    // Root
    SiteSuppliersService,
    // Site item prices
    SiteSupplierSiteItemPricesService,
    // Quotations
    SiteSupplierQuotationsService,
    // Invoices
    SupplierInvoicesService,
    SupplierInvoiceRecostingService,
    // Invoice lines
    SupplierInvoiceLinesService,
  ],
  exports: [SupplierInvoicesService, SupplierInvoiceLinesService],
})
export class SiteSuppliersModule {}
