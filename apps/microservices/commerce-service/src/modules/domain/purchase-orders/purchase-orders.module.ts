import { Module } from '@nestjs/common';
import { PurchaseOrdersDomainRepository } from './repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from './services/purchase-orders.service';

@Module({
  providers: [PurchaseOrdersDomainService, PurchaseOrdersDomainRepository],
  exports: [PurchaseOrdersDomainService, PurchaseOrdersDomainRepository],
})
export class PurchaseOrdersDomainModule {}
