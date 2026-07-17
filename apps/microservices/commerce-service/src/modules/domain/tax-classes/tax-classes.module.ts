import { Module } from '@nestjs/common';
import { TaxClassesRepository } from './repositories/tax-classes.repository';
import { TaxClassesService } from './services/tax-classes.service';

@Module({
  providers: [TaxClassesService, TaxClassesRepository],
  exports: [TaxClassesService, TaxClassesRepository],
})
export class TaxClassesDomainModule {}
