import { Module } from '@nestjs/common';
import { OfferingDimensionsDomainRepository } from './repositories/offering-dimensions.repository';
import { OfferingDimensionsDomainService } from './services/offering-dimensions.service';

@Module({
  providers: [OfferingDimensionsDomainService, OfferingDimensionsDomainRepository],
  exports: [OfferingDimensionsDomainService, OfferingDimensionsDomainRepository],
})
export class OfferingDimensionsDomainModule {}
