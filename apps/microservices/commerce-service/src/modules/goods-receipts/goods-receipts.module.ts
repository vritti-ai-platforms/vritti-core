import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptsBatchItemsController } from './batch-items/goods-receipts-batch-items.controller';
import { GoodsReceiptsBatchesController } from './batches/goods-receipts-batches.controller';
import { GoodsReceiptsItemsController } from './items/goods-receipts-items.controller';
import { GoodsReceiptsRootController } from './root/goods-receipts-root.controller';

@Module({
  imports: [GoodsReceiptsDomainModule],
  controllers: [
    GoodsReceiptsRootController,
    GoodsReceiptsItemsController,
    GoodsReceiptsBatchesController,
    GoodsReceiptsBatchItemsController,
  ],
})
export class GoodsReceiptsModule {}
