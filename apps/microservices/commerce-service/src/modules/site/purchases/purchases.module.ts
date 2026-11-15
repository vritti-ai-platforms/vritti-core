import { GoodsReceiptLinesDomainModule } from '@domain/goods-receipt-lines/goods-receipt-lines.module';
import { GoodsReceiptLotsDomainModule } from '@domain/goods-receipt-lots/goods-receipt-lots.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { InventoryItemSiteStockLevelsDomainModule } from '@domain/inventory-item-site-stock-levels/inventory-item-site-stock-levels.module';
import { LocationsDomainModule } from '@domain/locations/locations.module';
import { PaymentTermRulesDomainModule } from '@domain/payment-term-rules/payment-term-rules.module';
import { PaymentTermsDomainModule } from '@domain/payment-terms/payment-terms.module';
import { PurchaseItemAllocationsDomainModule } from '@domain/purchase-item-allocations/purchase-item-allocations.module';
import { PurchaseItemsDomainModule } from '@domain/purchase-items/purchase-items.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { PurchaseSuppliersDomainModule } from '@domain/purchase-suppliers/purchase-suppliers.module';
import { PurchasesDomainModule } from '@domain/purchases/purchases.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { SupplierInvoicesDomainModule } from '@domain/supplier-invoices/supplier-invoices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SupplierQuotationsDomainModule } from '@domain/supplier-quotations/supplier-quotations.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { SiteGoodsReceiptsModule } from '@/modules/site/goods-receipts/goods-receipts.module';
import { SitePurchaseProgressModule } from '@/modules/site/purchase-progress/purchase-progress.module';
import { SiteSuppliersModule } from '@/modules/site/suppliers/suppliers.module';
import { PurchasesAllocationsController } from './allocations/purchases-allocations.controller';
import { PurchasesAllocationsService } from './allocations/services/purchases-allocations.service';
import { PurchasesItemsController } from './items/purchases-items.controller';
import { PurchasesItemsService } from './items/services/purchases-items.service';
import { PurchasesLegsController } from './legs/purchases-legs.controller';
import { PurchaseLegDocumentsService } from './legs/services/purchase-leg-documents.service';
import { PurchasesLegsService } from './legs/services/purchases-legs.service';
import { PurchasesQuotationsController } from './quotations/purchases-quotations.controller';
import { PurchasesQuotationsService } from './quotations/services/purchases-quotations.service';
import { PurchasesReceiveWithInvoicesController } from './receive-with-invoices/purchases-receive-with-invoices.controller';
import { PurchasesReceiveWithInvoicesService } from './receive-with-invoices/services/purchases-receive-with-invoices.service';
import { ReceiveWithInvoiceDocumentsService } from './receive-with-invoices/services/receive-with-invoice-documents.service';
import { PurchasesRootController } from './root/purchases-root.controller';
import { PurchasesService } from './root/services/purchases-root.service';
import { PurchasesSourcingController } from './sourcing/purchases-sourcing.controller';
import { PurchasesSourcingService } from './sourcing/services/purchases-sourcing.service';
import { PurchasesSupplierInvoicesController } from './supplier-invoices/purchases-supplier-invoices.controller';
import { PurchasesSupplierInvoicesService } from './supplier-invoices/services/purchases-supplier-invoices.service';
import { PurchasesSuppliersController } from './suppliers/purchases-suppliers.controller';
import { PurchasesSuppliersService } from './suppliers/services/purchases-suppliers.service';

@Module({
  imports: [
    PurchasesDomainModule,
    PurchaseItemsDomainModule,
    PurchaseSuppliersDomainModule,
    PurchaseItemAllocationsDomainModule,
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    InboundDeliveriesDomainModule,
    GoodsReceiptsDomainModule,
    GoodsReceiptLotsDomainModule,
    GoodsReceiptLinesDomainModule,
    SupplierInvoicesDomainModule,
    InventoryItemSiteStockLevelsDomainModule,
    LocationsDomainModule,
    PaymentTermsDomainModule,
    PaymentTermRulesDomainModule,
    SuppliersDomainModule,
    SupplierEnrollmentsDomainModule,
    SupplierItemsDomainModule,
    SupplierQuotationsDomainModule,
    UomConversionsDomainModule,
    SitePurchaseProgressModule,
    SiteGoodsReceiptsModule,
    SiteSuppliersModule,
  ],
  controllers: [
    PurchasesRootController,
    PurchasesItemsController,
    PurchasesQuotationsController,
    PurchasesSourcingController,
    PurchasesAllocationsController,
    PurchasesSuppliersController,
    PurchasesLegsController,
    PurchasesSupplierInvoicesController,
    PurchasesReceiveWithInvoicesController,
  ],
  providers: [
    // Root
    PurchasesService,
    // Items
    PurchasesItemsService,
    // Quotations
    PurchasesQuotationsService,
    // Sourcing
    PurchasesSourcingService,
    // Allocations
    PurchasesAllocationsService,
    // Suppliers
    PurchasesSuppliersService,
    // Legs
    PurchasesLegsService,
    PurchaseLegDocumentsService,
    // Supplier invoices
    PurchasesSupplierInvoicesService,
    // Receive with Invoice
    PurchasesReceiveWithInvoicesService,
    ReceiveWithInvoiceDocumentsService,
  ],
  exports: [
    PurchasesService,
    PurchasesItemsService,
    PurchasesQuotationsService,
    PurchasesSourcingService,
    PurchasesAllocationsService,
    PurchasesSuppliersService,
    PurchasesLegsService,
    PurchasesSupplierInvoicesService,
    PurchasesReceiveWithInvoicesService,
  ],
})
export class SitePurchasesModule {}
