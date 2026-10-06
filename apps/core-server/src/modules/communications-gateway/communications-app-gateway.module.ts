import { Module } from '@nestjs/common';
import { CommunicationsGatewayServicesModule } from './communications-gateway-services.module';
import { SmsOtpsAppResolver } from './org-api/sms-otps/sms-otps.app.resolver';
import { WhatsappOtpsAppResolver } from './org-api/whatsapp-otps/whatsapp-otps.app.resolver';

// The external-app GraphQL surface for communications
@Module({
  imports: [CommunicationsGatewayServicesModule],
  providers: [SmsOtpsAppResolver, WhatsappOtpsAppResolver],
})
export class CommunicationsAppGatewayModule {}
