import { GoodsReceiptsDomainModule } from '@domain/goods-receipts/goods-receipts.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersItemsService } from './services/purchase-orders-items.service';

@Module({
  imports: [PurchaseOrdersDomainModule, GoodsReceiptsDomainModule, SuppliersDomainModule, SupplierItemsDomainModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersItemsService],
})
export class PurchaseOrdersModule {}
