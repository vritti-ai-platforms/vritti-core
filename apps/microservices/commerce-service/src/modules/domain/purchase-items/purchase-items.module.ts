import { Module } from '@nestjs/common';
import { PurchaseItemsDomainRepository } from './repositories/purchase-items.repository';
import { PurchaseItemsDomainService } from './services/purchase-items.service';

@Module({
  providers: [PurchaseItemsDomainService, PurchaseItemsDomainRepository],
  exports: [PurchaseItemsDomainService, PurchaseItemsDomainRepository],
})
export class PurchaseItemsDomainModule {}
