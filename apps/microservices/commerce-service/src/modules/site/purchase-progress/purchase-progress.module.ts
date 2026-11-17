import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { PurchaseItemAllocationsDomainModule } from '@domain/purchase-item-allocations/purchase-item-allocations.module';
import { PurchaseItemsDomainModule } from '@domain/purchase-items/purchase-items.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { PurchaseSuppliersDomainModule } from '@domain/purchase-suppliers/purchase-suppliers.module';
import { PurchasesDomainModule } from '@domain/purchases/purchases.module';
import { SupplierInvoicesDomainModule } from '@domain/supplier-invoices/supplier-invoices.module';
import { Module } from '@nestjs/common';
import { PurchaseProgressService } from './services/purchase-progress.service';

@Module({
  imports: [
    PurchasesDomainModule,
    PurchaseSuppliersDomainModule,
    PurchaseItemAllocationsDomainModule,
    PurchaseItemsDomainModule,
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    InboundDeliveriesDomainModule,
    GoodsReceiptsDomainModule,
    SupplierInvoicesDomainModule,
  ],
  providers: [PurchaseProgressService],
  exports: [PurchaseProgressService],
})
export class SitePurchaseProgressModule {}
