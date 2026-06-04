import { Module } from '@nestjs/common';
import { TaxGroupsRepository } from './repositories/tax-groups.repository';
import { TaxGroupsService } from './services/tax-groups.service';

@Module({
  providers: [TaxGroupsService, TaxGroupsRepository],
  exports: [TaxGroupsService, TaxGroupsRepository],
})
export class TaxGroupsDomainModule {}
