import { DimensionTemplateValuesDomainModule } from '@domain/dimension-template-values/dimension-template-values.module';
import { DimensionTemplatesDomainModule } from '@domain/dimension-templates/dimension-templates.module';
import { Module } from '@nestjs/common';
import { SiteDimensionTemplatesController } from './root/dimension-templates.controller';
import { SiteDimensionTemplateValuesController } from './values/dimension-template-values.controller';

@Module({
  imports: [DimensionTemplatesDomainModule, DimensionTemplateValuesDomainModule],
  controllers: [SiteDimensionTemplatesController, SiteDimensionTemplateValuesController],
})
export class SiteDimensionTemplatesModule {}
