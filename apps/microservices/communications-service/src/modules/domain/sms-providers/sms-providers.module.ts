import { Module } from '@nestjs/common';
import { SmsProvidersDomainRepository } from './repositories/sms-providers.repository';
import { SmsProvidersDomainService } from './services/sms-providers.service';

@Module({
  providers: [SmsProvidersDomainService, SmsProvidersDomainRepository],
  exports: [SmsProvidersDomainService, SmsProvidersDomainRepository],
})
export class SmsProvidersDomainModule {}
