import { TaxClassesDomainModule } from '@domain/tax-classes/tax-classes.module';
import { Module } from '@nestjs/common';
import { TaxClassesController } from './tax-classes.controller';

@Module({
  imports: [TaxClassesDomainModule],
  controllers: [TaxClassesController],
})
export class OrgTaxClassesModule {}
