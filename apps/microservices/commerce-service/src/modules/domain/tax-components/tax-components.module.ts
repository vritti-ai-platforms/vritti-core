import { Module } from '@nestjs/common';
import { TaxComponentsRepository } from './repositories/tax-components.repository';
import { TaxComponentsService } from './services/tax-components.service';

@Module({
  providers: [TaxComponentsService, TaxComponentsRepository],
  exports: [TaxComponentsService, TaxComponentsRepository],
})
export class TaxComponentsDomainModule {}
