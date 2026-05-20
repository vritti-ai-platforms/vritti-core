import { Module } from '@nestjs/common';
import { PurchaseOrderItemsRepository } from './repositories/purchase-order-items.repository';
import { PurchaseOrderItemsService } from './services/purchase-order-items.service';

@Module({
  providers: [PurchaseOrderItemsService, PurchaseOrderItemsRepository],
  exports: [PurchaseOrderItemsService, PurchaseOrderItemsRepository],
})
export class PurchaseOrderItemsDomainModule {}
