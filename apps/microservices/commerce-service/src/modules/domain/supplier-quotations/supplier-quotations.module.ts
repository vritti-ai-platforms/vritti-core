import { Module } from '@nestjs/common';
import { SupplierQuotationsDomainRepository } from './repositories/supplier-quotations.repository';
import { SupplierQuotationsDomainService } from './services/supplier-quotations.service';

@Module({
  providers: [SupplierQuotationsDomainService, SupplierQuotationsDomainRepository],
  exports: [SupplierQuotationsDomainService],
})
export class SupplierQuotationsDomainModule {}
