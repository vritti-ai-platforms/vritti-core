import { Module } from '@nestjs/common';
import { DimensionTemplateValuesDomainRepository } from './repositories/dimension-template-values.repository';
import { DimensionTemplateValuesDomainService } from './services/dimension-template-values.service';

@Module({
  providers: [DimensionTemplateValuesDomainService, DimensionTemplateValuesDomainRepository],
  exports: [DimensionTemplateValuesDomainService, DimensionTemplateValuesDomainRepository],
})
export class DimensionTemplateValuesDomainModule {}
