import { Module } from '@nestjs/common';
import { CommunicationsGatewayServicesModule } from './communications-gateway-services.module';
import { SmsOtpsGatewayController } from './org-api/sms-otps/sms-otps-gateway.controller';
import { SmsProvidersGatewayController } from './org-api/sms-providers/sms-providers-gateway.controller';
import { WhatsappAccountsPhoneNumbersGatewayController } from './org-api/whatsapp-accounts/phone-numbers/whatsapp-accounts-phone-numbers-gateway.controller';
import { WhatsappAccountsTemplatesGatewayController } from './org-api/whatsapp-accounts/templates/whatsapp-accounts-templates-gateway.controller';
import { WhatsappAccountsGatewayController } from './org-api/whatsapp-accounts/whatsapp-accounts-gateway.controller';
import { WhatsappOtpsGatewayController } from './org-api/whatsapp-otps/whatsapp-otps-gateway.controller';
import { SelectApiController } from './select-api/select-api.controller';

@Module({
  imports: [CommunicationsGatewayServicesModule],
  controllers: [
    SmsOtpsGatewayController,
    SmsProvidersGatewayController,
    WhatsappAccountsGatewayController,
    WhatsappAccountsPhoneNumbersGatewayController,
    WhatsappAccountsTemplatesGatewayController,
    WhatsappOtpsGatewayController,
    SelectApiController,
  ],
})
export class CommunicationsGatewayModule {}
