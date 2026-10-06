import { Module } from '@nestjs/common';
import { AttributeTemplatesDomainRepository } from './repositories/attribute-templates.repository';
import { AttributeTemplatesDomainService } from './services/attribute-templates.service';

@Module({
  providers: [AttributeTemplatesDomainService, AttributeTemplatesDomainRepository],
  exports: [AttributeTemplatesDomainService, AttributeTemplatesDomainRepository],
})
export class AttributeTemplatesDomainModule {}
