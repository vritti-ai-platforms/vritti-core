import { Module } from '@nestjs/common';
import { PurchaseSuppliersDomainRepository } from './repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from './services/purchase-suppliers.service';

@Module({
  providers: [PurchaseSuppliersDomainService, PurchaseSuppliersDomainRepository],
  exports: [PurchaseSuppliersDomainService, PurchaseSuppliersDomainRepository],
})
export class PurchaseSuppliersDomainModule {}
