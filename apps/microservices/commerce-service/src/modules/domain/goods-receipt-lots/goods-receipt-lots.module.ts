import { GoodsReceiptLinesRepository } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLotsRepository } from './repositories/goods-receipt-lots.repository';
import { GoodsReceiptLotsService } from './services/goods-receipt-lots.service';

// Provides GoodsReceiptLinesRepository directly to avoid the circular import with goods-receipt-lines
// (lines module already depends on lots module). Same trick as stock-adjustment-lots.module.ts.
@Module({
  imports: [GoodsReceiptsDomainModule, InventoryItemLotsDomainModule],
  providers: [GoodsReceiptLotsService, GoodsReceiptLotsRepository, GoodsReceiptLinesRepository],
  exports: [GoodsReceiptLotsService, GoodsReceiptLotsRepository],
})
export class GoodsReceiptLotsDomainModule {}
