import { OfferingDimensionTemplateValuesDomainModule } from '@domain/offering-dimension-template-values/offering-dimension-template-values.module';
import { OfferingDimensionTemplatesDomainModule } from '@domain/offering-dimension-templates/offering-dimension-templates.module';
import { Module } from '@nestjs/common';
import { LeOfferingDimensionTemplatesController } from './root/offering-dimension-templates.controller';
import { LeOfferingDimensionTemplateValuesController } from './values/offering-dimension-template-values.controller';

@Module({
  imports: [OfferingDimensionTemplatesDomainModule, OfferingDimensionTemplateValuesDomainModule],
  controllers: [LeOfferingDimensionTemplatesController, LeOfferingDimensionTemplateValuesController],
})
export class LeOfferingDimensionTemplatesModule {}
