import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { InventoryItemSitesDomainModule } from '@domain/inventory-item-sites/inventory-item-sites.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { SupplierInvoicesDomainModule } from '@domain/supplier-invoices/supplier-invoices.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersGoodsReceiptsController } from './goods-receipts/purchase-orders-goods-receipts.controller';
import { PurchaseOrdersInboundDeliveriesController } from './inbound-deliveries/purchase-orders-inbound-deliveries.controller';
import { PurchaseOrdersInvoicesController } from './invoices/root/purchase-orders-invoices.controller';
import { PurchaseOrdersItemsController } from './items/purchase-orders-items.controller';
import { PurchaseOrdersItemsService } from './items/services/purchase-orders-items.service';
import { PurchaseOrdersRootController } from './root/purchase-orders-root.controller';
import { PurchaseOrdersService } from './root/services/purchase-orders-root.service';

@Module({
  imports: [
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    GoodsReceiptsDomainModule,
    InboundDeliveriesDomainModule,
    InventoryItemSitesDomainModule,
    SuppliersDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    SupplierEnrollmentsDomainModule,
    UomConversionsDomainModule,
    SupplierInvoicesDomainModule,
  ],
  controllers: [
    PurchaseOrdersRootController,
    PurchaseOrdersItemsController,
    PurchaseOrdersGoodsReceiptsController,
    PurchaseOrdersInboundDeliveriesController,
    PurchaseOrdersInvoicesController,
  ],
  providers: [PurchaseOrdersService, PurchaseOrdersItemsService],
  exports: [PurchaseOrdersService, PurchaseOrdersItemsService],
})
export class SitePurchaseOrdersModule {}
