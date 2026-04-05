import { Module } from '@nestjs/common';
import { TaxGroupsController } from './tax-groups.controller';
import { TaxGroupsRepository } from './repositories/tax-groups.repository';
import { TaxGroupsService } from './services/tax-groups.service';

@Module({
  controllers: [TaxGroupsController],
  providers: [TaxGroupsService, TaxGroupsRepository],
})
export class TaxGroupsModule {}
