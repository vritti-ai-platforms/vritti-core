import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLotsRepository } from './repositories/goods-receipt-lots.repository';
import { GoodsReceiptLotsService } from './services/goods-receipt-lots.service';

@Module({
  imports: [GoodsReceiptsDomainModule, InventoryItemLotsDomainModule],
  providers: [GoodsReceiptLotsService, GoodsReceiptLotsRepository],
  exports: [GoodsReceiptLotsService, GoodsReceiptLotsRepository],
})
export class GoodsReceiptLotsDomainModule {}
