import { TaxComponentsDomainModule } from '@domain/tax-components/tax-components.module';
import { Module } from '@nestjs/common';
import { TaxComponentsController } from './tax-components.controller';

@Module({
  imports: [TaxComponentsDomainModule],
  controllers: [TaxComponentsController],
})
export class OrgTaxComponentsModule {}
