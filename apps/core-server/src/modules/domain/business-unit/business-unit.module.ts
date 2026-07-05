import { Module } from '@nestjs/common';
import { BusinessUnitRepository } from './repositories/business-unit.repository';
import { BusinessUnitService } from './services/business-unit.service';

@Module({
  providers: [BusinessUnitService, BusinessUnitRepository],
  exports: [BusinessUnitService, BusinessUnitRepository],
})
export class BusinessUnitDomainModule {}
