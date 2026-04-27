import { Module, forwardRef } from '@nestjs/common';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { GoodsReceiptItemsRepository } from './repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptItemsService } from './services/goods-receipt-items.service';
import { GoodsReceiptsService } from './services/goods-receipts.service';

@Module({
  imports: [PurchaseOrdersDomainModule, InventoryItemQuantsDomainModule, InventoryLedgerDomainModule],
  providers: [
    GoodsReceiptsService,
    GoodsReceiptItemsService,
    GoodsReceiptsRepository,
    GoodsReceiptItemsRepository,
  ],
  exports: [
    GoodsReceiptsService,
    GoodsReceiptItemsService,
    GoodsReceiptsRepository,
    GoodsReceiptItemsRepository,
  ],
})
export class GoodsReceiptsDomainModule {}

void forwardRef;
