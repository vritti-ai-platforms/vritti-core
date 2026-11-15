import { Module } from '@nestjs/common';
import { PurchaseEventsDomainRepository } from './repositories/purchase-events.repository';
import { PurchaseEventsDomainService } from './services/purchase-events.service';

@Module({
  providers: [PurchaseEventsDomainService, PurchaseEventsDomainRepository],
  exports: [PurchaseEventsDomainService, PurchaseEventsDomainRepository],
})
export class PurchaseEventsDomainModule {}
