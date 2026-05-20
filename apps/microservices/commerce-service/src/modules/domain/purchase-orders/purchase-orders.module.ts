import { Module } from '@nestjs/common';
import { PurchaseOrdersRepository } from './repositories/purchase-orders.repository';
import { PurchaseOrdersService } from './services/purchase-orders.service';

@Module({
  providers: [PurchaseOrdersService, PurchaseOrdersRepository],
  exports: [PurchaseOrdersService, PurchaseOrdersRepository],
})
export class PurchaseOrdersDomainModule {}
