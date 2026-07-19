import { Module } from '@nestjs/common';
import { UomDimensionsDomainRepository } from './repositories/uom-dimensions.repository';
import { UomDimensionsDomainService } from './services/uom-dimensions.service';

@Module({
  providers: [UomDimensionsDomainService, UomDimensionsDomainRepository],
  exports: [UomDimensionsDomainService, UomDimensionsDomainRepository],
})
export class UomDimensionsDomainModule {}
