import { Module } from '@nestjs/common';
import { OfferingDimensionTemplateValuesDomainRepository } from './repositories/offering-dimension-template-values.repository';
import { OfferingDimensionTemplateValuesDomainService } from './services/offering-dimension-template-values.service';

@Module({
  providers: [OfferingDimensionTemplateValuesDomainService, OfferingDimensionTemplateValuesDomainRepository],
  exports: [OfferingDimensionTemplateValuesDomainService, OfferingDimensionTemplateValuesDomainRepository],
})
export class OfferingDimensionTemplateValuesDomainModule {}
