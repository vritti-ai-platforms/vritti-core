import { Module } from '@nestjs/common';
import { AttributeTemplateValuesDomainRepository } from './repositories/attribute-template-values.repository';
import { AttributeTemplateValuesDomainService } from './services/attribute-template-values.service';

@Module({
  providers: [AttributeTemplateValuesDomainService, AttributeTemplateValuesDomainRepository],
  exports: [AttributeTemplateValuesDomainService, AttributeTemplateValuesDomainRepository],
})
export class AttributeTemplateValuesDomainModule {}
