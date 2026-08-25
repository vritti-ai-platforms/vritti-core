import { Module } from '@nestjs/common';
import { WhatsappAccountsGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-gateway.service';
import { WhatsappAccountsGatewayController } from './org-api/whatsapp-accounts/whatsapp-accounts-gateway.controller';

@Module({
  controllers: [WhatsappAccountsGatewayController],
  providers: [WhatsappAccountsGatewayService],
})
export class CommunicationsGatewayModule {}
