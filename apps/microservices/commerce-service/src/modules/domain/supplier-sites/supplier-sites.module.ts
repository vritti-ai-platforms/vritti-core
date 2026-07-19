import { Module } from '@nestjs/common';
import { SupplierSitesDomainRepository } from './repositories/supplier-sites.repository';
import { SupplierSitesDomainService } from './services/supplier-sites.service';

@Module({
  providers: [SupplierSitesDomainService, SupplierSitesDomainRepository],
  exports: [SupplierSitesDomainService, SupplierSitesDomainRepository],
})
export class SupplierSitesDomainModule {}
