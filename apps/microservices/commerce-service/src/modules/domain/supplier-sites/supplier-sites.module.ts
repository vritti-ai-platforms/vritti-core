import { PartyFunctionsDomainModule } from '@domain/party-functions/party-functions.module';
import { Module } from '@nestjs/common';
import { SupplierSitesDomainRepository } from './repositories/supplier-sites.repository';
import { SupplierSitesDomainService } from './services/supplier-sites.service';

@Module({
  imports: [PartyFunctionsDomainModule],
  providers: [SupplierSitesDomainService, SupplierSitesDomainRepository],
  exports: [SupplierSitesDomainService, SupplierSitesDomainRepository],
})
export class SupplierSitesDomainModule {}
