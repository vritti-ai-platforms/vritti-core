import { InventoryItemLedgerDomainModule } from '@domain/inventory-item-ledger/inventory-item-ledger.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { forwardRef, Module } from '@nestjs/common';
import { GoodsReceiptItemsRepository } from './repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptItemsService } from './services/goods-receipt-items.service';
import { GoodsReceiptsService } from './services/goods-receipts.service';

@Module({
  imports: [
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    SupplierItemsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemLedgerDomainModule,
    UomConversionsDomainModule,
  ],
  providers: [GoodsReceiptsService, GoodsReceiptItemsService, GoodsReceiptsRepository, GoodsReceiptItemsRepository],
  exports: [GoodsReceiptsService, GoodsReceiptItemsService, GoodsReceiptsRepository, GoodsReceiptItemsRepository],
})
export class GoodsReceiptsDomainModule {}

void forwardRef;
