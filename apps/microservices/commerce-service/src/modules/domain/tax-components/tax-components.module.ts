import { Module } from '@nestjs/common';
import { TaxComponentsDomainRepository } from './repositories/tax-components.repository';
import { TaxComponentsDomainService } from './services/tax-components.service';

@Module({
  providers: [TaxComponentsDomainService, TaxComponentsDomainRepository],
  exports: [TaxComponentsDomainService, TaxComponentsDomainRepository],
})
export class TaxComponentsDomainModule {}
