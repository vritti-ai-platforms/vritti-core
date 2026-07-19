import { Module } from '@nestjs/common';
import { TaxClassesDomainRepository } from './repositories/tax-classes.repository';
import { TaxClassesDomainService } from './services/tax-classes.service';

@Module({
  providers: [TaxClassesDomainService, TaxClassesDomainRepository],
  exports: [TaxClassesDomainService, TaxClassesDomainRepository],
})
export class TaxClassesDomainModule {}
