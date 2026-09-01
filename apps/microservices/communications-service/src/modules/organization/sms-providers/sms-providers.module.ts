import { SmsProvidersDomainModule } from '@domain/sms-providers/sms-providers.module';
import { Module } from '@nestjs/common';
import { SmsProvidersController } from './sms-providers.controller';
import { SmsProvidersInternalController } from './sms-providers-internal.controller';

@Module({
  imports: [SmsProvidersDomainModule],
  controllers: [SmsProvidersController, SmsProvidersInternalController],
})
export class OrgSmsProvidersModule {}
