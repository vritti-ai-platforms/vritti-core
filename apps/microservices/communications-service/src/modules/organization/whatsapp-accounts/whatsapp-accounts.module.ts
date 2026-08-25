import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountsController } from './whatsapp-accounts.controller';

@Module({
  imports: [WhatsappAccountsDomainModule],
  controllers: [WhatsappAccountsController],
})
export class OrgWhatsappAccountsModule {}
