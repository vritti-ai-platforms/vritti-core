import { Module } from '@nestjs/common';
import { WhatsappAccountsDomainRepository } from './repositories/whatsapp-accounts.repository';
import { WhatsappAccountsDomainService } from './services/whatsapp-accounts.service';

@Module({
  providers: [WhatsappAccountsDomainService, WhatsappAccountsDomainRepository],
  exports: [WhatsappAccountsDomainService, WhatsappAccountsDomainRepository],
})
export class WhatsappAccountsDomainModule {}
