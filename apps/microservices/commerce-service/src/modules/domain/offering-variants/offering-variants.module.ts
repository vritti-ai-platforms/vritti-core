import { Module } from '@nestjs/common';
import { OfferingVariantsDomainRepository } from './repositories/offering-variants.repository';
import { OfferingVariantsDomainService } from './services/offering-variants.service';

@Module({
  providers: [OfferingVariantsDomainService, OfferingVariantsDomainRepository],
  exports: [OfferingVariantsDomainService, OfferingVariantsDomainRepository],
})
export class OfferingVariantsDomainModule {}
