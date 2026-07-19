import { GoodsReceiptLinesDomainModule } from '@domain/goods-receipt-lines/goods-receipt-lines.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptLineItemsDomainRepository } from './repositories/goods-receipt-line-items.repository';
import { GoodsReceiptLineItemsDomainService } from './services/goods-receipt-line-items.service';

@Module({
  imports: [GoodsReceiptLinesDomainModule],
  providers: [GoodsReceiptLineItemsDomainService, GoodsReceiptLineItemsDomainRepository],
  exports: [GoodsReceiptLineItemsDomainService, GoodsReceiptLineItemsDomainRepository],
})
export class GoodsReceiptLineItemsDomainModule {}
