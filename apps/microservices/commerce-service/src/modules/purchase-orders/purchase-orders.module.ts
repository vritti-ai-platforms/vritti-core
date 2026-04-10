import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';

@Module({
  imports: [PurchaseOrdersDomainModule],
  controllers: [PurchaseOrdersController],
})
export class PurchaseOrdersModule {}
