import { SmsOtpsDomainModule } from '@domain/sms-otps/sms-otps.module';
import { SmsProviderTemplatesDomainModule } from '@domain/sms-provider-templates/sms-provider-templates.module';
import { SmsProvidersDomainModule } from '@domain/sms-providers/sms-providers.module';
import { Module } from '@nestjs/common';
import { SmsOtpsService } from './services/sms-otps.service';
import { SmsOtpsController } from './sms-otps.controller';

@Module({
  imports: [SmsOtpsDomainModule, SmsProvidersDomainModule, SmsProviderTemplatesDomainModule],
  controllers: [SmsOtpsController],
  providers: [SmsOtpsService],
})
export class OrgSmsOtpsModule {}
