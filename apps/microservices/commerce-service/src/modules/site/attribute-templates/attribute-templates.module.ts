import { AttributeTemplateValuesDomainModule } from '@domain/attribute-template-values/attribute-template-values.module';
import { AttributeTemplatesDomainModule } from '@domain/attribute-templates/attribute-templates.module';
import { Module } from '@nestjs/common';
import { SiteAttributeTemplatesController } from './root/attribute-templates.controller';
import { SiteAttributeTemplateValuesController } from './values/attribute-template-values.controller';

@Module({
  imports: [AttributeTemplatesDomainModule, AttributeTemplateValuesDomainModule],
  controllers: [SiteAttributeTemplatesController, SiteAttributeTemplateValuesController],
})
export class SiteAttributeTemplatesModule {}
