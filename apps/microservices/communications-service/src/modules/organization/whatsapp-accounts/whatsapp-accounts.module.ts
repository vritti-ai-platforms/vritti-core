import { WhatsappAccountPhoneNumbersDomainModule } from '@domain/whatsapp-account-phone-numbers/whatsapp-account-phone-numbers.module';
import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountsPhoneNumbersController } from './phone-numbers/whatsapp-accounts-phone-numbers.controller';
import { WhatsappAccountsController } from './root/whatsapp-accounts.controller';

@Module({
  imports: [WhatsappAccountsDomainModule, WhatsappAccountPhoneNumbersDomainModule],
  controllers: [WhatsappAccountsController, WhatsappAccountsPhoneNumbersController],
})
export class OrgWhatsappAccountsModule {}
