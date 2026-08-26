import { WhatsappAccountPhoneNumbersDomainModule } from '@domain/whatsapp-account-phone-numbers/whatsapp-account-phone-numbers.module';
import { WhatsappAccountTemplatesDomainModule } from '@domain/whatsapp-account-templates/whatsapp-account-templates.module';
import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { Module } from '@nestjs/common';
import { WhatsappAccountsPhoneNumbersController } from './phone-numbers/whatsapp-accounts-phone-numbers.controller';
import { WhatsappAccountsController } from './root/whatsapp-accounts.controller';
import { WhatsappAccountsTemplatesController } from './templates/whatsapp-accounts-templates.controller';

@Module({
  imports: [
    WhatsappAccountsDomainModule,
    WhatsappAccountPhoneNumbersDomainModule,
    WhatsappAccountTemplatesDomainModule,
  ],
  controllers: [
    WhatsappAccountsController,
    WhatsappAccountsPhoneNumbersController,
    WhatsappAccountsTemplatesController,
  ],
})
export class OrgWhatsappAccountsModule {}
