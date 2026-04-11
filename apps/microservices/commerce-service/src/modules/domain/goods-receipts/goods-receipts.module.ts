import { Module } from '@nestjs/common';
import { InventoryLevelsDomainModule } from '@domain/inventory-levels/inventory-levels.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { GoodsReceiptsRepository } from './repositories/goods-receipts.repository';
import { GoodsReceiptsService } from './services/goods-receipts.service';

@Module({
  imports: [PurchaseOrdersDomainModule, InventoryLevelsDomainModule],
  providers: [GoodsReceiptsService, GoodsReceiptsRepository],
  exports: [GoodsReceiptsService, GoodsReceiptsRepository],
})
export class GoodsReceiptsDomainModule {}
