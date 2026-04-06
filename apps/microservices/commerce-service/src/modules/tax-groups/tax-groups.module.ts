import { TaxGroupsDomainModule } from '@domain/tax-groups/tax-groups.module';
import { Module } from '@nestjs/common';
import { TaxGroupsController } from './tax-groups.controller';

@Module({
  imports: [TaxGroupsDomainModule],
  controllers: [TaxGroupsController],
})
export class TaxGroupsModule {}
