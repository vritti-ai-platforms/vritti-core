import { Module } from '@nestjs/common';
import { OfferingsDomainRepository } from './repositories/offerings.repository';
import { OfferingsDomainService } from './services/offerings.service';

@Module({
  providers: [OfferingsDomainService, OfferingsDomainRepository],
  exports: [OfferingsDomainService, OfferingsDomainRepository],
})
export class OfferingsDomainModule {}
