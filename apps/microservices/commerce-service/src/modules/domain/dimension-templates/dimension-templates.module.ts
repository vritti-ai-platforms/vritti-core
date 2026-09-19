import { Module } from '@nestjs/common';
import { DimensionTemplatesDomainRepository } from './repositories/dimension-templates.repository';
import { DimensionTemplatesDomainService } from './services/dimension-templates.service';

@Module({
  providers: [DimensionTemplatesDomainService, DimensionTemplatesDomainRepository],
  exports: [DimensionTemplatesDomainService, DimensionTemplatesDomainRepository],
})
export class DimensionTemplatesDomainModule {}
