import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { Module } from '@nestjs/common';
import { GoodsReceiptsController } from './goods-receipts.controller';

@Module({
  imports: [GoodsReceiptsDomainModule],
  controllers: [GoodsReceiptsController],
})
export class GoodsReceiptsModule {}
