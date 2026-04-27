import { GoodsReceiptLineItemsDomainModule } from '@domain/goods-receipt-line-items/goods-receipt-line-items.module';
import { GoodsReceiptLinesDomainModule } from '@domain/goods-receipt-lines/goods-receipt-lines.module';
import { GoodsReceiptLotsDomainModule } from '@domain/goods-receipt-lots/goods-receipt-lots.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptsItemsController } from './items/goods-receipts-items.controller';
import { GoodsReceiptsLineItemsController } from './line-items/goods-receipts-line-items.controller';
import { GoodsReceiptsLinesController } from './lines/goods-receipts-lines.controller';
import { GoodsReceiptsLotsController } from './lots/goods-receipts-lots.controller';
import { GoodsReceiptsRootController } from './root/goods-receipts-root.controller';
import { GoodsReceiptsPublishService } from './root/services/goods-receipts-publish.service';

@Module({
  imports: [
    GoodsReceiptsDomainModule,
    GoodsReceiptLotsDomainModule,
    GoodsReceiptLinesDomainModule,
    GoodsReceiptLineItemsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryLedgerDomainModule,
    PurchaseOrdersDomainModule,
  ],
  controllers: [
    GoodsReceiptsRootController,
    GoodsReceiptsItemsController,
    GoodsReceiptsLotsController,
    GoodsReceiptsLinesController,
    GoodsReceiptsLineItemsController,
  ],
  providers: [GoodsReceiptsPublishService],
})
export class GoodsReceiptsModule {}
