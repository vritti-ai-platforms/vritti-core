import { Module } from '@nestjs/common';
import { TaxJurisdictionsDomainRepository } from './repositories/tax-jurisdictions.repository';
import { TaxJurisdictionsDomainService } from './services/tax-jurisdictions.service';

@Module({
  providers: [TaxJurisdictionsDomainService, TaxJurisdictionsDomainRepository],
  exports: [TaxJurisdictionsDomainService, TaxJurisdictionsDomainRepository],
})
export class TaxJurisdictionsDomainModule {}
