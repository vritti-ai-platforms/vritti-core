import { Module } from '@nestjs/common';
import { SmsOtpsDomainRepository } from './repositories/sms-otps.repository';
import { SmsOtpsDomainService } from './services/sms-otps.service';

@Module({
  providers: [SmsOtpsDomainService, SmsOtpsDomainRepository],
  exports: [SmsOtpsDomainService, SmsOtpsDomainRepository],
})
export class SmsOtpsDomainModule {}
