import { DimensionTemplateValuesDomainModule } from '@domain/dimension-template-values/dimension-template-values.module';
import { DimensionTemplatesDomainModule } from '@domain/dimension-templates/dimension-templates.module';
import { Module } from '@nestjs/common';
import { OrgDimensionTemplatesController } from './root/dimension-templates.controller';
import { OrgDimensionTemplateValuesController } from './values/dimension-template-values.controller';

@Module({
  imports: [DimensionTemplatesDomainModule, DimensionTemplateValuesDomainModule],
  controllers: [OrgDimensionTemplatesController, OrgDimensionTemplateValuesController],
})
export class OrgDimensionTemplatesModule {}
