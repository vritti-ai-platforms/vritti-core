import { Module } from '@nestjs/common';
import { PurchasesDomainRepository } from './repositories/purchases.repository';
import { PurchasesDomainService } from './services/purchases.service';

@Module({
  providers: [PurchasesDomainService, PurchasesDomainRepository],
  exports: [PurchasesDomainService, PurchasesDomainRepository],
})
export class PurchasesDomainModule {}
