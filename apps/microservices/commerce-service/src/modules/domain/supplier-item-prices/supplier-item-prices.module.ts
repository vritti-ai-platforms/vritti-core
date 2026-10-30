import { Module } from '@nestjs/common';
import { SupplierItemPricesDomainRepository } from './repositories/supplier-item-prices.repository';
import { SupplierItemPricesDomainService } from './services/supplier-item-prices.service';

@Module({
  providers: [SupplierItemPricesDomainService, SupplierItemPricesDomainRepository],
  exports: [SupplierItemPricesDomainService, SupplierItemPricesDomainRepository],
})
export class SupplierItemPricesDomainModule {}
