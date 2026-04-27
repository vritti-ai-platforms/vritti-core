import { GoodsReceiptLotsDomainModule } from '@domain/goods-receipt-lots/goods-receipt-lots.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLinesRepository } from './repositories/goods-receipt-lines.repository';
import { GoodsReceiptLinesService } from './services/goods-receipt-lines.service';

@Module({
  imports: [GoodsReceiptsDomainModule, GoodsReceiptLotsDomainModule],
  providers: [GoodsReceiptLinesService, GoodsReceiptLinesRepository],
  exports: [GoodsReceiptLinesService, GoodsReceiptLinesRepository],
})
export class GoodsReceiptLinesDomainModule {}
