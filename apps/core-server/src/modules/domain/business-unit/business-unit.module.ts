import { Module } from '@nestjs/common';
import { BusinessUnitRepository } from './repositories/business-unit.repository';
import { BuContextCacheService } from '@/common/services/bu-context-cache.service';
import { BusinessUnitService } from './services/business-unit.service';

@Module({
  providers: [BusinessUnitService, BusinessUnitRepository, BuContextCacheService],
  exports: [BusinessUnitService, BusinessUnitRepository, BuContextCacheService],
})
export class BusinessUnitDomainModule {}
