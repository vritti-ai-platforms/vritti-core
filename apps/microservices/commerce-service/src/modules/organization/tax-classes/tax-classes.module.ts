import { TaxClassesDomainModule } from '@domain/tax-classes/tax-classes.module';
import { TaxGroupsDomainModule } from '@domain/tax-groups/tax-groups.module';
import { Module } from '@nestjs/common';
import { TaxClassesGroupsController } from './groups/tax-classes-groups.controller';
import { TaxClassesController } from './tax-classes.controller';

@Module({
  imports: [TaxClassesDomainModule, TaxGroupsDomainModule],
  controllers: [TaxClassesController, TaxClassesGroupsController],
})
export class OrgTaxClassesModule {}
