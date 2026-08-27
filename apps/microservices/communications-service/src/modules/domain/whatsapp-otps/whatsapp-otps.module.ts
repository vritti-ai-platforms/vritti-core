import { Module } from '@nestjs/common';
import { WhatsappOtpsDomainRepository } from './repositories/whatsapp-otps.repository';
import { WhatsappOtpsDomainService } from './services/whatsapp-otps.service';

@Module({
  providers: [WhatsappOtpsDomainService, WhatsappOtpsDomainRepository],
  exports: [WhatsappOtpsDomainService, WhatsappOtpsDomainRepository],
})
export class WhatsappOtpsDomainModule {}
