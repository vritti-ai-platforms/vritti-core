import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptBatchItemsRepository } from './repositories/goods-receipt-batch-items.repository';
import { GoodsReceiptBatchesRepository } from './repositories/goods-receipt-batches.repository';
import { GoodsReceiptItemsRepository } from './repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptBatchItemsService } from './services/goods-receipt-batch-items.service';
import { GoodsReceiptBatchesService } from './services/goods-receipt-batches.service';
import { GoodsReceiptItemsService } from './services/goods-receipt-items.service';
import { GoodsReceiptsPublishService } from './services/goods-receipts-publish.service';
import { GoodsReceiptsService } from './services/goods-receipts.service';

@Module({
  imports: [PurchaseOrdersDomainModule, InventoryItemBatchesDomainModule, InventoryLedgerDomainModule],
  providers: [
    GoodsReceiptsService,
    GoodsReceiptsPublishService,
    GoodsReceiptItemsService,
    GoodsReceiptBatchesService,
    GoodsReceiptBatchItemsService,
    GoodsReceiptsRepository,
    GoodsReceiptItemsRepository,
    GoodsReceiptBatchesRepository,
    GoodsReceiptBatchItemsRepository,
  ],
  exports: [
    GoodsReceiptsService,
    GoodsReceiptsPublishService,
    GoodsReceiptItemsService,
    GoodsReceiptBatchesService,
    GoodsReceiptBatchItemsService,
    GoodsReceiptsRepository,
    GoodsReceiptItemsRepository,
    GoodsReceiptBatchesRepository,
    GoodsReceiptBatchItemsRepository,
  ],
})
export class GoodsReceiptsDomainModule {}
