import { Module } from '@nestjs/common';
import { OfferingDimensionTemplatesDomainRepository } from './repositories/offering-dimension-templates.repository';
import { OfferingDimensionTemplatesDomainService } from './services/offering-dimension-templates.service';

@Module({
  providers: [OfferingDimensionTemplatesDomainService, OfferingDimensionTemplatesDomainRepository],
  exports: [OfferingDimensionTemplatesDomainService, OfferingDimensionTemplatesDomainRepository],
})
export class OfferingDimensionTemplatesDomainModule {}
