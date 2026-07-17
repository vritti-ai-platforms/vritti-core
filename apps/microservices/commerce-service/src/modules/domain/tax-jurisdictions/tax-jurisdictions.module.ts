import { Module } from '@nestjs/common';
import { TaxJurisdictionsRepository } from './repositories/tax-jurisdictions.repository';
import { TaxJurisdictionsService } from './services/tax-jurisdictions.service';

@Module({
  providers: [TaxJurisdictionsService, TaxJurisdictionsRepository],
  exports: [TaxJurisdictionsService, TaxJurisdictionsRepository],
})
export class TaxJurisdictionsDomainModule {}
