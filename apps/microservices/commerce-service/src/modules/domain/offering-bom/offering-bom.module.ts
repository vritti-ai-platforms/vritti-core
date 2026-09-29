import { Module } from '@nestjs/common';
import { OfferingBomDomainRepository } from './repositories/offering-bom.repository';
import { OfferingBomDomainService } from './services/offering-bom.service';

@Module({
  providers: [OfferingBomDomainService, OfferingBomDomainRepository],
  exports: [OfferingBomDomainService, OfferingBomDomainRepository],
})
export class OfferingBomDomainModule {}
