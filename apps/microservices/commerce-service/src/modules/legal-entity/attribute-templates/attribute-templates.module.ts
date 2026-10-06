import { AttributeTemplateValuesDomainModule } from '@domain/attribute-template-values/attribute-template-values.module';
import { AttributeTemplatesDomainModule } from '@domain/attribute-templates/attribute-templates.module';
import { Module } from '@nestjs/common';
import { LeAttributeTemplatesController } from './root/attribute-templates.controller';
import { LeAttributeTemplateValuesController } from './values/attribute-template-values.controller';

@Module({
  imports: [AttributeTemplatesDomainModule, AttributeTemplateValuesDomainModule],
  controllers: [LeAttributeTemplatesController, LeAttributeTemplateValuesController],
})
export class LeAttributeTemplatesModule {}
