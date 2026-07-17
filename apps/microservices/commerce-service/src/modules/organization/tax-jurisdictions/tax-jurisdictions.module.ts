import { TaxJurisdictionsDomainModule } from '@domain/tax-jurisdictions/tax-jurisdictions.module';
import { Module } from '@nestjs/common';
import { TaxJurisdictionsController } from './tax-jurisdictions.controller';

@Module({
  imports: [TaxJurisdictionsDomainModule],
  controllers: [TaxJurisdictionsController],
})
export class OrgTaxJurisdictionsModule {}
