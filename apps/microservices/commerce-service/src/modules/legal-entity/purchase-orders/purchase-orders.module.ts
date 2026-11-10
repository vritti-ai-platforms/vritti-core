import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierInvoicesDomainModule } from '@domain/supplier-invoices/supplier-invoices.module';
import { Module } from '@nestjs/common';
import { SitePurchaseOrdersModule } from '@/modules/site/purchase-orders/purchase-orders.module';
import { LePurchaseOrdersGoodsReceiptsController } from './goods-receipts/purchase-orders-goods-receipts.controller';
import { LePurchaseOrdersInboundDeliveriesController } from './inbound-deliveries/purchase-orders-inbound-deliveries.controller';
import { LePurchaseOrdersInvoicesController } from './invoices/root/purchase-orders-invoices.controller';
import { LePurchaseOrdersItemsController } from './items/purchase-orders-items.controller';
import { LePurchaseOrdersRootController } from './root/purchase-orders-root.controller';

@Module({
  imports: [
    SitePurchaseOrdersModule,
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    GoodsReceiptsDomainModule,
    InboundDeliveriesDomainModule,
    SupplierInvoicesDomainModule,
  ],
  controllers: [
    LePurchaseOrdersRootController,
    LePurchaseOrdersItemsController,
    LePurchaseOrdersGoodsReceiptsController,
    LePurchaseOrdersInboundDeliveriesController,
    LePurchaseOrdersInvoicesController,
  ],
})
export class LePurchaseOrdersModule {}
