import { Module } from '@nestjs/common';
import { OfferingAttributesDomainRepository } from './repositories/offering-attributes.repository';
import { OfferingAttributesDomainService } from './services/offering-attributes.service';

@Module({
  providers: [OfferingAttributesDomainService, OfferingAttributesDomainRepository],
  exports: [OfferingAttributesDomainService, OfferingAttributesDomainRepository],
})
export class OfferingAttributesDomainModule {}
