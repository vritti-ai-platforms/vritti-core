import { Module } from '@nestjs/common';
import { SmsProviderTemplatesDomainRepository } from './repositories/sms-provider-templates.repository';
import { SmsProviderTemplatesDomainService } from './services/sms-provider-templates.service';

@Module({
  providers: [SmsProviderTemplatesDomainService, SmsProviderTemplatesDomainRepository],
  exports: [SmsProviderTemplatesDomainService, SmsProviderTemplatesDomainRepository],
})
export class SmsProviderTemplatesDomainModule {}
