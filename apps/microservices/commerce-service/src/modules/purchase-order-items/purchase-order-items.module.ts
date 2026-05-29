import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { Module } from '@nestjs/common';
import { PurchaseOrderItemsController } from './purchase-order-items.controller';

@Module({
  imports: [PurchaseOrderItemsDomainModule],
  controllers: [PurchaseOrderItemsController],
})
export class PurchaseOrderItemsModule {}
