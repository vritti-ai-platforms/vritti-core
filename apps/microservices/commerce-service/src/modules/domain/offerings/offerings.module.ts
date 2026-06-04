import { Module } from '@nestjs/common';
import { OfferingsRepository } from './repositories/offerings.repository';
import { OfferingsService } from './services/offerings.service';

@Module({
  providers: [OfferingsService, OfferingsRepository],
  exports: [OfferingsService, OfferingsRepository],
})
export class OfferingsDomainModule {}
