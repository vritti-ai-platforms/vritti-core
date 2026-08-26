import { Module } from '@nestjs/common';
import { WhatsappAccountsPhoneNumbersGatewayController } from './org-api/whatsapp-accounts/phone-numbers/whatsapp-accounts-phone-numbers-gateway.controller';
import { WhatsappAccountsGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-gateway.service';
import { WhatsappAccountsPhoneNumbersGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-phone-numbers-gateway.service';
import { WhatsappAccountsTemplatesGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-templates-gateway.service';
import { WhatsappAccountsTemplatesGatewayController } from './org-api/whatsapp-accounts/templates/whatsapp-accounts-templates-gateway.controller';
import { WhatsappAccountsGatewayController } from './org-api/whatsapp-accounts/whatsapp-accounts-gateway.controller';
import { SelectApiController } from './select-api/select-api.controller';

@Module({
  controllers: [
    WhatsappAccountsGatewayController,
    WhatsappAccountsPhoneNumbersGatewayController,
    WhatsappAccountsTemplatesGatewayController,
    SelectApiController,
  ],
  providers: [
    WhatsappAccountsGatewayService,
    WhatsappAccountsPhoneNumbersGatewayService,
    WhatsappAccountsTemplatesGatewayService,
  ],
})
export class CommunicationsGatewayModule {}
