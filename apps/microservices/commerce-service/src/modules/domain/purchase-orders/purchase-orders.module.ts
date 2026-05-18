import { Module } from '@nestjs/common';
import { PurchaseOrderItemsRepository } from './repositories/purchase-order-items.repository';
import { PurchaseOrdersRepository } from './repositories/purchase-orders.repository';
import { PurchaseOrdersService } from './services/purchase-orders.service';

@Module({
  providers: [PurchaseOrdersService, PurchaseOrdersRepository, PurchaseOrderItemsRepository],
  exports: [PurchaseOrdersService, PurchaseOrdersRepository, PurchaseOrderItemsRepository],
})
export class PurchaseOrdersDomainModule {}
