import { GoodsReceiptLotsDomainModule } from '@domain/goods-receipt-lots/goods-receipt-lots.module';
import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLinesDomainRepository } from './repositories/goods-receipt-lines.repository';
import { GoodsReceiptLinesDomainService } from './services/goods-receipt-lines.service';

@Module({
  imports: [GoodsReceiptsDomainModule, GoodsReceiptLotsDomainModule],
  providers: [GoodsReceiptLinesDomainService, GoodsReceiptLinesDomainRepository],
  exports: [GoodsReceiptLinesDomainService, GoodsReceiptLinesDomainRepository],
})
export class GoodsReceiptLinesDomainModule {}
