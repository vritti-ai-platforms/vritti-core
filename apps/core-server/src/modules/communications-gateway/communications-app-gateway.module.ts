import { Module } from '@nestjs/common';
import { CommunicationsGatewayServicesModule } from './communications-gateway-services.module';
import { SmsOtpsAppResolver } from './org-api/sms-otps/sms-otps.app.resolver';
import { WhatsappOtpsAppResolver } from './org-api/whatsapp-otps/whatsapp-otps.app.resolver';

/**
 * The external-app GraphQL surface for communications.
 *
 * `include` walks imports transitively, so this module's whole closure has to stay free of the
 * internal surface's resolvers — hence `CommunicationsGatewayServicesModule` (services only) and
 * never `CommunicationsGatewayModule`. `graphql-surfaces.spec.ts` enforces it.
 */
@Module({
  imports: [CommunicationsGatewayServicesModule],
  providers: [SmsOtpsAppResolver, WhatsappOtpsAppResolver],
})
export class CommunicationsAppGatewayModule {}
