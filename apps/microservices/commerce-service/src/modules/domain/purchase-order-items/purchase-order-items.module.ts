import { Module } from '@nestjs/common';
import { PurchaseOrderItemsDomainRepository } from './repositories/purchase-order-items.repository';
import { PurchaseOrderItemsDomainService } from './services/purchase-order-items.service';

@Module({
  providers: [PurchaseOrderItemsDomainService, PurchaseOrderItemsDomainRepository],
  exports: [PurchaseOrderItemsDomainService, PurchaseOrderItemsDomainRepository],
})
export class PurchaseOrderItemsDomainModule {}
