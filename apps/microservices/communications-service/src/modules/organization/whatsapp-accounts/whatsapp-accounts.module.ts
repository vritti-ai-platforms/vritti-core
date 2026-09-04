import { WhatsappAccountPhoneNumbersDomainModule } from '@domain/whatsapp-account-phone-numbers/whatsapp-account-phone-numbers.module';
import { WhatsappAccountTemplatesDomainModule } from '@domain/whatsapp-account-templates/whatsapp-account-templates.module';
import { WhatsappAccountsDomainModule } from '@domain/whatsapp-accounts/whatsapp-accounts.module';
import { WhatsappEmbeddedSignupDomainModule } from '@domain/whatsapp-embedded-signup/whatsapp-embedded-signup.module';
import { Module } from '@nestjs/common';
import { WhatsappEmbeddedSignupService } from './embedded-signup/services/whatsapp-embedded-signup.service';
import { WhatsappAccountsEmbeddedSignupController } from './embedded-signup/whatsapp-accounts-embedded-signup.controller';
import { WhatsappPhoneNumbersService } from './phone-numbers/services/whatsapp-phone-numbers.service';
import { WhatsappAccountsPhoneNumbersController } from './phone-numbers/whatsapp-accounts-phone-numbers.controller';
import { WhatsappAccountsController } from './root/whatsapp-accounts.controller';
import { WhatsappTemplatesService } from './templates/services/whatsapp-templates.service';
import { WhatsappAccountsTemplatesController } from './templates/whatsapp-accounts-templates.controller';

@Module({
  imports: [
    WhatsappAccountsDomainModule,
    WhatsappAccountPhoneNumbersDomainModule,
    WhatsappAccountTemplatesDomainModule,
    WhatsappEmbeddedSignupDomainModule,
  ],
  controllers: [
    WhatsappAccountsController,
    WhatsappAccountsEmbeddedSignupController,
    WhatsappAccountsPhoneNumbersController,
    WhatsappAccountsTemplatesController,
  ],
  providers: [WhatsappTemplatesService, WhatsappPhoneNumbersService, WhatsappEmbeddedSignupService],
})
export class OrgWhatsappAccountsModule {}
