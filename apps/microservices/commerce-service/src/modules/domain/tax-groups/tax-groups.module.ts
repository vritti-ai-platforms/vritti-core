import { Module } from '@nestjs/common';
import { TaxGroupsDomainRepository } from './repositories/tax-groups.repository';
import { TaxGroupsDomainService } from './services/tax-groups.service';

@Module({
  providers: [TaxGroupsDomainService, TaxGroupsDomainRepository],
  exports: [TaxGroupsDomainService, TaxGroupsDomainRepository],
})
export class TaxGroupsDomainModule {}
