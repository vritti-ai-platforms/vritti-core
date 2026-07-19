import { InventoryItemLedgerDomainModule } from '@domain/inventory-item-ledger/inventory-item-ledger.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { forwardRef, Module } from '@nestjs/common';
import { GoodsReceiptItemsDomainRepository } from './repositories/goods-receipt-items.repository';
import { GoodsReceiptsDomainRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptItemsDomainService } from './services/goods-receipt-items.service';
import { GoodsReceiptsDomainService } from './services/goods-receipts.service';

@Module({
  imports: [
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    SupplierItemsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemLedgerDomainModule,
    UomConversionsDomainModule,
  ],
  providers: [
    GoodsReceiptsDomainService,
    GoodsReceiptItemsDomainService,
    GoodsReceiptsDomainRepository,
    GoodsReceiptItemsDomainRepository,
  ],
  exports: [
    GoodsReceiptsDomainService,
    GoodsReceiptItemsDomainService,
    GoodsReceiptsDomainRepository,
    GoodsReceiptItemsDomainRepository,
  ],
})
export class GoodsReceiptsDomainModule {}

void forwardRef;
