import { Module } from '@nestjs/common';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { GoodsReceiptsRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptsService } from './services/goods-receipts.service';

@Module({
  imports: [PurchaseOrdersDomainModule, InventoryItemsDomainModule],
  providers: [GoodsReceiptsService, GoodsReceiptsRepository],
  exports: [GoodsReceiptsService, GoodsReceiptsRepository],
})
export class GoodsReceiptsDomainModule {}
