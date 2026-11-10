import { TaxGroupsDomainModule } from '@domain/tax-groups/tax-groups.module';
import { Module } from '@nestjs/common';
import { TaxGroupsClassesController } from './classes/tax-groups-classes.controller';
import { TaxGroupsRatesController } from './rates/tax-groups-rates.controller';
import { TaxGroupsRootController } from './root/tax-groups-root.controller';

@Module({
  imports: [TaxGroupsDomainModule],
  controllers: [TaxGroupsRootController, TaxGroupsRatesController, TaxGroupsClassesController],
})
export class OrgTaxGroupsModule {}
