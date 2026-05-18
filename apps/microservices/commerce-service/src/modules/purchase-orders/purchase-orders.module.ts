import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';

@Module({
  imports: [PurchaseOrdersDomainModule, GoodsReceiptsDomainModule, SuppliersDomainModule],
  controllers: [PurchaseOrdersController],
})
export class PurchaseOrdersModule {}
