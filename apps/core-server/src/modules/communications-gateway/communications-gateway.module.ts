import { Module } from '@nestjs/common';
import { WhatsappAccountsPhoneNumbersGatewayController } from './org-api/whatsapp-accounts/phone-numbers/whatsapp-accounts-phone-numbers-gateway.controller';
import { WhatsappAccountsGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-gateway.service';
import { WhatsappAccountsPhoneNumbersGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-phone-numbers-gateway.service';
import { WhatsappAccountsGatewayController } from './org-api/whatsapp-accounts/whatsapp-accounts-gateway.controller';

@Module({
  controllers: [WhatsappAccountsGatewayController, WhatsappAccountsPhoneNumbersGatewayController],
  providers: [WhatsappAccountsGatewayService, WhatsappAccountsPhoneNumbersGatewayService],
})
export class CommunicationsGatewayModule {}
