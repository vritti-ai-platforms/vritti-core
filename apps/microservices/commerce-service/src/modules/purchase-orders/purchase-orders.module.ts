import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';

@Module({
  imports: [PurchaseOrdersDomainModule, GoodsReceiptsDomainModule],
  controllers: [PurchaseOrdersController],
})
export class PurchaseOrdersModule {}
