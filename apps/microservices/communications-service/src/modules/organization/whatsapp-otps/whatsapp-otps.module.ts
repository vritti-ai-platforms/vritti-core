import { WhatsappAccountTemplatesDomainModule } from '@domain/whatsapp-account-templates/whatsapp-account-templates.module';
import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { WhatsappOtpsDomainModule } from '@domain/whatsapp-otps/whatsapp-otps.module';
import { Module } from '@nestjs/common';
import { WhatsappOtpsService } from './services/whatsapp-otps.service';
import { WhatsappOtpsController } from './whatsapp-otps.controller';

@Module({
  imports: [WhatsappOtpsDomainModule, WhatsappAccountsDomainModule, WhatsappAccountTemplatesDomainModule],
  controllers: [WhatsappOtpsController],
  providers: [WhatsappOtpsService],
})
export class OrgWhatsappOtpsModule {}
