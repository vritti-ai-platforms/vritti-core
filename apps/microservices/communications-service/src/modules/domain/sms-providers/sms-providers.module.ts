import { Module } from '@nestjs/common';
import { SmsProvidersDomainRepository } from './repositories/sms-providers.repository';
import { ConsoleSmsTransport, SmsProviderRegistry } from './services/sms-provider-transports';
import { SmsProvidersDomainService } from './services/sms-providers.service';

@Module({
  providers: [SmsProvidersDomainService, SmsProvidersDomainRepository, ConsoleSmsTransport, SmsProviderRegistry],
  exports: [SmsProvidersDomainService, SmsProvidersDomainRepository, SmsProviderRegistry],
})
export class SmsProvidersDomainModule {}
