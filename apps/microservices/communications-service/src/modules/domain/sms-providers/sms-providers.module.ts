import { Msg91Module } from '@domain/msg91/msg91.module';
import { Module } from '@nestjs/common';
import { SmsProvidersDomainRepository } from './repositories/sms-providers.repository';
import { ConsoleSmsTransport, Msg91SmsTransport, SmsProviderRegistry } from './services/sms-provider-transports';
import { SmsProvidersDomainService } from './services/sms-providers.service';

// Msg91Module is infrastructure rather than a sibling domain — the same footing on which
// WhatsappAccountTemplatesDomainModule imports MetaGraphModule
@Module({
  imports: [Msg91Module],
  providers: [
    SmsProvidersDomainService,
    SmsProvidersDomainRepository,
    ConsoleSmsTransport,
    Msg91SmsTransport,
    SmsProviderRegistry,
  ],
  exports: [SmsProvidersDomainService, SmsProvidersDomainRepository, SmsProviderRegistry],
})
export class SmsProvidersDomainModule {}
