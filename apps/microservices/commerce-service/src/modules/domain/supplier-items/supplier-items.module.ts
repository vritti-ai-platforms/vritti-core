import { Module } from '@nestjs/common';
import { SupplierItemsDomainRepository } from './repositories/supplier-items.repository';
import { SupplierItemsDomainService } from './services/supplier-items.service';

@Module({
  providers: [SupplierItemsDomainService, SupplierItemsDomainRepository],
  exports: [SupplierItemsDomainService, SupplierItemsDomainRepository],
})
export class SupplierItemsDomainModule {}
