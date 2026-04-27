import { GoodsReceiptLinesDomainModule } from '@domain/goods-receipt-lines/goods-receipt-lines.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLineItemsRepository } from './repositories/goods-receipt-line-items.repository';
import { GoodsReceiptLineItemsService } from './services/goods-receipt-line-items.service';

@Module({
  imports: [GoodsReceiptLinesDomainModule],
  providers: [GoodsReceiptLineItemsService, GoodsReceiptLineItemsRepository],
  exports: [GoodsReceiptLineItemsService, GoodsReceiptLineItemsRepository],
})
export class GoodsReceiptLineItemsDomainModule {}
