import { Module } from '@nestjs/common';
import { CommunicationsGatewayServicesModule } from '../communications-gateway-services.module';
import { EmbeddedSignupBrokerService } from './services/embedded-signup-broker.service';
import { WhatsappEmbeddedSignupBrokerController } from './whatsapp-embedded-signup-broker.controller';

/**
 * Unprefixed, mirroring WhatsappWebhookModule: the callback's absolute URL is registered in the Meta
 * app dashboard, so it must not sit behind the `communications-api` RouterModule prefix.
 *
 * Reuses the gateway services module rather than talking to NATS itself — a completed signup takes
 * exactly the same path as the old browser-facing route did, which is what keeps the connect,
 * ownership check and persistence untouched by this change. The state signer comes from there too,
 * since the mint side needs it as well.
 */
@Module({
  imports: [CommunicationsGatewayServicesModule],
  controllers: [WhatsappEmbeddedSignupBrokerController],
  providers: [EmbeddedSignupBrokerService],
})
export class WhatsappEmbeddedSignupBrokerModule {}
