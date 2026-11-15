import { Module } from '@nestjs/common';
import { PurchaseItemAllocationsDomainRepository } from './repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from './services/purchase-item-allocations.service';

@Module({
  providers: [PurchaseItemAllocationsDomainService, PurchaseItemAllocationsDomainRepository],
  exports: [PurchaseItemAllocationsDomainService, PurchaseItemAllocationsDomainRepository],
})
export class PurchaseItemAllocationsDomainModule {}
