import { OfferingDimensionTemplateValuesDomainModule } from '@domain/offering-dimension-template-values/offering-dimension-template-values.module';
import { OfferingDimensionTemplatesDomainModule } from '@domain/offering-dimension-templates/offering-dimension-templates.module';
import { Module } from '@nestjs/common';
import { OrgOfferingDimensionTemplatesController } from './root/offering-dimension-templates.controller';
import { OrgOfferingDimensionTemplateValuesController } from './values/offering-dimension-template-values.controller';

@Module({
  imports: [OfferingDimensionTemplatesDomainModule, OfferingDimensionTemplateValuesDomainModule],
  controllers: [OrgOfferingDimensionTemplatesController, OrgOfferingDimensionTemplateValuesController],
})
export class OrgOfferingDimensionTemplatesModule {}
