import { AttributeTemplateValuesDomainModule } from '@domain/attribute-template-values/attribute-template-values.module';
import { AttributeTemplatesDomainModule } from '@domain/attribute-templates/attribute-templates.module';
import { Module } from '@nestjs/common';
import { OrgAttributeTemplatesController } from './root/attribute-templates.controller';
import { OrgAttributeTemplateValuesController } from './values/attribute-template-values.controller';

@Module({
  imports: [AttributeTemplatesDomainModule, AttributeTemplateValuesDomainModule],
  controllers: [OrgAttributeTemplatesController, OrgAttributeTemplateValuesController],
})
export class OrgAttributeTemplatesModule {}
