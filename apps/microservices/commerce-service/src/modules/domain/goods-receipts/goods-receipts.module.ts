import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptsRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptsService } from './services/goods-receipts.service';

@Module({
  imports: [PurchaseOrdersDomainModule, InventoryItemBatchesDomainModule],
  providers: [GoodsReceiptsService, GoodsReceiptsRepository],
  exports: [GoodsReceiptsService, GoodsReceiptsRepository],
})
export class GoodsReceiptsDomainModule {}
