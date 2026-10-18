import { Module } from '@nestjs/common';
import { CommunicationsGatewayServicesModule } from '../communications-gateway-services.module';
import { EmbeddedSignupBrokerService } from './services/embedded-signup-broker.service';
import { WhatsappEmbeddedSignupBrokerController } from './whatsapp-embedded-signup-broker.controller';

// Unprefixed, mirroring WhatsappWebhookModule: the callback's absolute URL is registered in the Meta app dashboard, so it must not sit behind the `communications-api` RouterModule prefix
@Module({
  imports: [CommunicationsGatewayServicesModule],
  controllers: [WhatsappEmbeddedSignupBrokerController],
  providers: [EmbeddedSignupBrokerService],
})
export class WhatsappEmbeddedSignupBrokerModule {}
