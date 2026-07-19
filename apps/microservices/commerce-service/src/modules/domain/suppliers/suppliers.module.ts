import { Module } from '@nestjs/common';
import { SuppliersDomainRepository } from './repositories/suppliers.repository';
import { SuppliersDomainService } from './services/suppliers.service';

@Module({
  providers: [SuppliersDomainService, SuppliersDomainRepository],
  exports: [SuppliersDomainService, SuppliersDomainRepository],
})
export class SuppliersDomainModule {}
